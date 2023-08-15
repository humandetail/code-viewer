/**
 * Code Renderer
 */

import { DEFAULT_HEADER_BAR, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SELECT_STYLE, DEFAULT_STYLE, DEFAULT_SCOPE_STYLES, type Style, type ScopeStyles, DEFAULT_HEADER_BAR_DARK } from '../config/defaultSetting'
import { deepMergeObject, getMouseCoordinate, isEmptyObject, isString } from '../utils/tools'
import Renderer from './Renderer'
import { type Row, parseContent } from './Parser'
import ScrollBar, { ScrollBarType } from './ScrollBar'
import { type Coordinate } from '../types'
import { type CodeViewerTheme, lightTheme, darkTheme } from '../themes'

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
        padding: [top, right, bottom, left]
      },
      renderer
    } = this

    let newWidth = width
    let newHeight = height

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const actualWidth = this.actualWidth = Math.max.apply(null, this.#rows.map(({ width }) => width)) + (right ?? 0) + (left ?? 0)

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const actualHeight = this.actualHeight = (this.#rows.at(-1)?.top ?? 0) + (this.#rows.at(-1)?.height ?? 0) + (top ?? 0) + (bottom ?? 0)

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

    console.log(this)
    return this
  }

  #setState <T extends keyof this>(prop: T, state: this[T]) {
    this[prop] = state

    const {
      width,
      renderer,
      headerBar,
      style: {
        lineHeight
      }
    } = this

    let { height } = this

    const {
      style: {
        padding: [padTop, , padBottom]
      }
    } = headerBar

    switch (prop) {
      case 'copyState':
        renderer.drawHeaderBar(headerBar)
        this.afterRender()
        break
      case 'collapsed':
        if (state) {
          height = lineHeight + padTop + padBottom
          renderer.init(width, height)
          renderer.drawHeaderBar(headerBar)
          this.afterRender()
        } else {
          renderer.init(width, height)
          this.update(undefined, undefined, false)
        }
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
      renderer,
      lineNumberStyle,
      horizontalScrollBar,
      verticalScrollBar
    } = this

    if (resetScroll) {
      horizontalScrollBar.scroll(0)
      verticalScrollBar.scroll(0)
    }
    renderer.update(
      this.#rows,
      lineNumberStyle,
      {
        x: horizontalScrollBar.scrollDistance,
        y: verticalScrollBar.scrollDistance
      },
      this.headerBar
    )
    this.afterRender()
  }

  updateRows () {
    if (this.content) {
      const {
        width,
        style: {
          padding,
          lineHeight
        },
        breakRow,
        displayLineNumber,
        lineNumberStyle,
        content,
        language
      } = this

      if (!width) {
        this.#rows = []
        return
      }

      this.#rows = parseContent(
        content,
        language,
        breakRow,
        displayLineNumber,
        lineNumberStyle,
        width - (padding[1] ?? 0) - (padding[3] ?? 0), // max content render width
        lineHeight,
        this.headerBar,
        this.getScopeStyle.bind(this)
      )
    } else {
      this.#rows = []
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

    this.renderer.render(this.#rows, this.lineNumberStyle, { x: 0, y: 0 }, this.headerBar)
    this.afterRender()
    return this
  }

  afterRender () {
    const {
      breakRow,
      horizontalScrollBar,
      verticalScrollBar,
      renderer
    } = this

    if (horizontalScrollBar.isActive) {
      horizontalScrollBar.show()
    }

    if (verticalScrollBar.isActive) {
      verticalScrollBar.show()
    }

    renderer.afterRender(breakRow)
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

    this.renderer.update(this.#rows, this.lineNumberStyle, { x, y })
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
