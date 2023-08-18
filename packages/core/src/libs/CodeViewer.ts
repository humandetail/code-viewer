/**
 * Code Renderer
 */

import { DEFAULT_HEADER_BAR, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SELECT_STYLE, DEFAULT_STYLE, DEFAULT_SCOPE_STYLES, type Style, type ScopeStyles, DEFAULT_HEADER_BAR_DARK } from '../config/defaultSetting'
import { deepMergeObject, getMouseCoordinate, isEmptyObject, isString } from '../utils/tools'
import Renderer from './Renderer'
import { type Row, parseContent, parseHeaderBar } from './Parser'
import ScrollBar, { ScrollBarType } from './ScrollBar'
import { type Coordinate } from '../types'
import { type CodeViewerTheme, lightTheme, darkTheme } from '../themes'
import { createBlock, type Block, BlockType } from './Block'

type Overflow = 'auto' | 'hidden' | 'scroll'

export interface ViewerOptions {
  content?: string
  // code language
  language?: string

  width?: number
  height?: number

  themeMode?: 'light' | 'dark'

  displayLineNumber?: boolean
  wrap?: boolean
  selectable?: boolean
  breakRow?: boolean
  overflowX?: Overflow
  overflowY?: Overflow

  collapsed?: boolean
}

export default class CodeViewer {
  renderer: Renderer
  content = ''
  language = 'plainText'

  width = 0
  height = 0
  actualWidth = 0
  actualHeight = 0

  headerBar = DEFAULT_HEADER_BAR

  style = DEFAULT_STYLE
  selectStyle = DEFAULT_SELECT_STYLE
  lineNumberStyle = DEFAULT_LINE_NUMBER_STYLE

  displayLineNumber = true
  wrap = false
  selectable = true
  breakRow = true
  /** is collapsed */
  collapsed = false
  copyState: 'Default' | 'Success' | 'Failure' = 'Default'

  // If overflowX is `auto` and breakRow is false.
  // The canvas width will follow the maximum width of the row.
  // If overflowX is `scroll` and breakRow is false.
  // A horizontal scroll bar will be displayed.
  overflowX: Overflow = 'auto'
  overflowY: Overflow = 'auto'

  scopeStyles: ScopeStyles = DEFAULT_SCOPE_STYLES

  #isMounted = false

  #rows: Row[] = []
  #headerBarBlocks: Block[] = []
  #blocks: Block[] = []

  horizontalScrollBar!: ScrollBar
  verticalScrollBar!: ScrollBar

  constructor (options: ViewerOptions = {}, theme: CodeViewerTheme = options.themeMode === 'dark' ? darkTheme : lightTheme) {
    deepMergeObject(this, options)

    if (options.themeMode === 'dark') {
      this.headerBar = DEFAULT_HEADER_BAR_DARK
    }

    this.setTheme(theme, options.themeMode)

    this.updateRows()

    this.renderer = new Renderer(
      this.style,
      this,
      options.width,
      options.height
    )
  }

  get maxContentWidth () {
    const {
      width,
      style: {
        padding: [, right]
      },
      breakRow
    } = this

    if (!breakRow) {
      return Infinity
    }

    return width - right
  }

  #init (initEvent = true) {
    const {
      breakRow,
      overflowX,
      overflowY,
      width,
      height,
      style: {
        padding: [, right, bottom]
      },
      renderer
    } = this

    let newWidth = width
    let newHeight = height

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const actualWidth = this.actualWidth = Math.max.apply(null, this.#blocks.map(({ x, width }) => x + width)) + (right ?? 0)

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const actualHeight = this.actualHeight = Math.max.apply(null, this.#blocks.map(({ y, height }) => y + height)) + (bottom ?? 0)

    this.horizontalScrollBar = new ScrollBar(renderer, {
      type: ScrollBarType.horizontal,
      actualLength: actualWidth,
      visibleLength: width,
      style: {
        size: 8,
        borderColor: '#abc',
        backgroundColor: '#ddd',
        thumbBackgroundColor: 'orange'
      }
    })
    this.verticalScrollBar = new ScrollBar(renderer, {
      type: ScrollBarType.vertical,
      actualLength: actualHeight,
      visibleLength: height,
      style: {
        size: 8,
        borderColor: '#222',
        backgroundColor: '#ccc',
        thumbBackgroundColor: 'rgba(0,0,0,.1)'
      }
    })

    if (!breakRow) {
      if (overflowX === 'auto') {
        // reset canvas width
        newWidth = actualWidth
      } else if (overflowX === 'scroll' && actualWidth > width) {
        this.horizontalScrollBar.setState(true)
      }
    }

    if (overflowY === 'auto') {
      // reset canvas width
      newHeight = actualHeight
    } else if (overflowY === 'scroll' && actualHeight > height) {
      this.verticalScrollBar.setState(true)
    }

    if (newWidth !== width || newHeight !== height) {
      this.width = newWidth
      this.height = newHeight
      this.renderer.init(newWidth, newHeight)
    }

    if (initEvent) {
      this.#initEvents()
    }
  }

  #initEvents () {
    const {
      renderer,
      horizontalScrollBar,
      verticalScrollBar
    } = this

    const allowScroll = horizontalScrollBar.isActive || verticalScrollBar.isActive

    if (allowScroll) {
      renderer.canvas.addEventListener('wheel', this.handleMouseWheel)
    }

    renderer.canvas.addEventListener('click', this.handleClick)
  }

  setTheme (theme: CodeViewerTheme, themeMode: 'light' | 'dark' = 'light'): CodeViewer {
    Object.assign(this, themeMode === 'dark' ? darkTheme : lightTheme)
    deepMergeObject(this, theme)

    return this
  }

  #setState <T extends keyof this>(prop: T, state: this[T]) {
    this[prop] = state

    switch (prop) {
      case 'copyState':
        this.#headerBarBlocks = parseHeaderBar(this)
        this.render()
        break
      case 'collapsed':
        this.#headerBarBlocks = parseHeaderBar(this)
        this.render()
        break
      default:
        break
    }
  }

  getScopeStyle (scope: keyof ScopeStyles): Required<Style> {
    const { scopeStyles, style } = this

    if (!scope) {
      return style
    }

    const fullScopeStyle = scopeStyles[scope] as Required<Style>

    if ((scope as string).includes('.')) {
      const s = (scope as string).split('.').reduce<Style>((prev, key) => {
        const s = scopeStyles[key as keyof ScopeStyles] as Required<Style>
        if (s) {
          Object.assign(prev, s)
        }

        return prev
      }, {})

      if (!isEmptyObject(fullScopeStyle)) {
        Object.assign(s, fullScopeStyle)
      }

      return {
        ...style,
        ...s
      }
    }

    return {
      ...style,
      ...fullScopeStyle
    }
  }

  update (content?: string, language?: string, resetScroll = true) {
    if (!this.#isMounted) {
      throw new Error('Make sure the `mount()` method is called first.')
    }

    if (content) {
      this.content = content
    }
    if (language) {
      this.language = language
    }

    this.updateRows()
    /** @todo */
    this.#init(false)

    const {
      horizontalScrollBar,
      verticalScrollBar
    } = this

    if (resetScroll) {
      horizontalScrollBar.scroll(0)
      verticalScrollBar.scroll(0)
    }
    this.render()
    this.afterRender()
  }

  updateRows () {
    if (this.content) {
      const {
        width,
        content,
        language
      } = this

      if (!width) {
        this.#headerBarBlocks = []
        this.#blocks = []
        return
      }

      this.#headerBarBlocks = parseHeaderBar(this)

      this.#blocks = parseContent(
        content,
        language,
        this
      )
    } else {
      this.#headerBarBlocks = []
      this.#blocks = []
    }
  }

  /**
   * - Make sure that the row height follows the base style `line-height`,
   *   not the line style `line-height`.
   */
  render (): CodeViewer {
    if (!this.#isMounted) {
      throw new Error('Make sure the `mount()` method is called first.')
    }

    const blocks = [...this.#headerBarBlocks, ...this.#blocks]

    // add bg Block
    const {
      width,
      height,
      collapsed,
      style: {
        borderRadius,
        borderColor,
        lineHeight,
        borderWidth,
        backgroundColor
      },
      headerBar: {
        style: {
          padding: [padTop, , padBottom]
        }
      },
      renderer
    } = this

    const w = width
    let h = height

    if (collapsed) {
      h = lineHeight + padTop + padBottom
    }
    renderer.init(w, h)

    blocks.unshift(createBlock(BlockType.RECTANGLE, {
      x: width / 2,
      y: height / 2,
      width: w,
      height: h,
      radii: borderRadius,
      fillColor: backgroundColor,
      strokeColor: 'transparent'
    }))

    // add border block
    if (borderWidth > 0 && borderColor && borderColor !== 'transparent') {
      blocks.push(createBlock(BlockType.RECTANGLE, {
        x: w / 2,
        y: h / 2,
        width: w,
        height: h,
        radii: borderRadius,
        fillColor: 'transparent',
        strokeWidth: borderWidth,
        strokeColor: borderColor
      }))
    }

    renderer.render(blocks)
    this.afterRender()

    return this
  }

  afterRender () {
    const {
      horizontalScrollBar,
      verticalScrollBar
    } = this

    if (horizontalScrollBar.isActive) {
      horizontalScrollBar.show()
    }

    if (verticalScrollBar.isActive) {
      verticalScrollBar.show()
    }
  }

  execScroll ({ x, y }: Coordinate, behaviors: 'scroll' | 'scrollBy' = 'scroll') {
    const {
      horizontalScrollBar,
      verticalScrollBar
    } = this

    if (horizontalScrollBar.isActive) {
      x = horizontalScrollBar[behaviors](x)
    } else {
      x = 0
    }
    if (verticalScrollBar.isActive) {
      y = verticalScrollBar[behaviors](y)
    } else {
      y = 0
    }
    console.log(x, y)

    // this.renderer.update(this.#rows, this.lineNumberStyle, { x, y })
    this.afterRender()
  }

  handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault()

    const x = e.deltaX * 0.1
    const y = e.deltaY * 0.1

    this.execScroll({
      x,
      y
    }, 'scrollBy')
  }

  handleClick = (e: MouseEvent) => {
    const { x, y } = getMouseCoordinate(e)

    const { renderer } = this

    const pos = renderer.getMousePosition({ x, y })

    switch (pos) {
      case 'btn-copy':
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleCopy()
        break
      case 'btn-collapse':
        this.toggleCollapse()
        break
      case 'other':
      default:
        break
    }
  }

  async handleCopy () {
    if (this.copyState !== 'Default') {
      return
    }

    try {
      await navigator.clipboard.writeText(this.content)

      this.#setState('copyState', 'Success')
    } catch (err) {
      this.#setState('copyState', 'Failure')
      /** eslint-disable-next-line no-console */
      console.error(err)
    } finally {
      setTimeout(() => {
        this.#setState('copyState', 'Default')
      }, 2000)
    }
  }

  toggleCollapse () {
    this.#setState('collapsed', !this.collapsed)
  }

  mount (el: string | Element): CodeViewer {
    const parentElement = isString(el)
      ? document.querySelector<Element>(el)
      : el

    if ((parentElement == null) || !('innerHTML' in parentElement)) {
      throw new TypeError(`'el' expect a Element or a string, but got '${typeof el}'`)
    }

    const { renderer } = this

    if (!this.width || !this.height) {
      const { width, height } = parentElement.getBoundingClientRect()

      renderer.init(width, height)

      this.width = width
      this.height = height
    }

    // try parse content again
    if (this.#rows.length === 0 && this.content) {
      this.updateRows()
    }

    parentElement.appendChild(renderer.canvas)

    this.#isMounted = true

    this.#init()

    return this
  }

  unmount () {
    this.renderer.canvas.remove()
  }
}
