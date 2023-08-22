/**
 * Code Renderer
 */

import { DEFAULT_LINE_NUMBER_STYLE, DEFAULT_STYLE, type Style, type ScopeStyles, DEFAULT_HEADER_BAR_STYLE, BTN_COPY_ID, BTN_COLLAPSE_ID } from '../config/defaultSetting'
import { deepMergeObject, getMouseCoordinate, isEmptyObject, isString } from '../utils/tools'
import Renderer from './Renderer'
import { parseContent, parseHeaderBar } from './Parser'
import ScrollBar, { ScrollBarType } from './ScrollBar'
import { type Coordinate } from '../types'
import { type CodeViewerTheme, lightTheme, darkTheme } from '../themes'
import { createBlock, type Block, BlockType, Fixed, type GroupBlock } from './Block'
import type { Size } from './Measure'

type Overflow = 'auto' | 'hidden' | 'scroll'

export interface HeaderBarSetting {
  visible: boolean
  displayLanguage?: boolean
  collapsible?: boolean
  copyable?: boolean
}

export interface ViewerOptions {
  content?: string
  // code language
  language?: string

  width?: number
  height?: number

  themeMode?: 'light' | 'dark'

  displayLineNumber?: boolean
  breakRow?: boolean
  overflowX?: Overflow
  overflowY?: Overflow

  headerBarSetting?: HeaderBarSetting

  // collapsed?: boolean
}

export default class CodeViewer {
  renderer: Renderer
  content = ''
  language = 'plainText'

  width = 0
  height = 0
  actualWidth = 0
  actualHeight = 0

  // headerBar = DEFAULT_HEADER_BAR
  headerBarSetting: HeaderBarSetting = {
    visible: false,
    displayLanguage: false,
    collapsible: false,
    copyable: false
  }

  style = DEFAULT_STYLE
  lineNumberStyle = DEFAULT_LINE_NUMBER_STYLE
  headerBarStyle = DEFAULT_HEADER_BAR_STYLE

  displayLineNumber = true
  breakRow = true
  /** is collapsed */
  // collapsed = false
  copyState: 'Default' | 'Success' | 'Failure' = 'Default'
  scrollState: Coordinate = { x: 0, y: 0 }

  // If overflowX is `auto` and breakRow is false.
  // The canvas width will follow the maximum width of the row.
  // If overflowX is `scroll` and breakRow is false.
  // A horizontal scroll bar will be displayed.
  overflowX: Overflow = 'auto'
  overflowY: Overflow = 'auto'

  scopeStyles: ScopeStyles = {}

  #isMounted = false
  isCollapsed = false

  #headerBarBlocks: Block[] = []
  #blocks: Block[] = []

  horizontalScrollBar!: ScrollBar
  verticalScrollBar!: ScrollBar

  constructor (options: ViewerOptions = {}, theme: CodeViewerTheme = options.themeMode === 'dark' ? darkTheme : lightTheme) {
    deepMergeObject(this, options)

    this.setTheme(theme, options.themeMode)

    this.updateBlocks()

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

  get viewportSize (): Size {
    const {
      width,
      height,
      isCollapsed,
      style: {
        lineHeight
      },
      headerBarStyle: {
        padding: [padTop, , padBottom]
      }
    } = this

    return {
      width,
      height: isCollapsed
        ? lineHeight + padTop + padBottom
        : height
    }
  }

  get viewportBlocks (): Block[] {
    const {
      viewportSize: {
        width,
        height
      },
      scrollState: {
        x,
        y
      }
    } = this

    const blocks = [
      ...this.#blocks.filter(block => {
        return block.fixed !== Fixed.UNSET || !(
          (block.x + block.width - x) < 0 ||
          (block.x - x) > width ||
          (block.y + block.height - y) < 0 ||
          (block.y - y) > height
        )
      }),
      ...this.#headerBarBlocks
    ]

    const {
      style: {
        backgroundColor,
        borderRadius,
        borderWidth,
        borderColor
      }
    } = this

    // add bg Block
    blocks.unshift(createBlock(BlockType.RECTANGLE, {
      x: width / 2,
      y: height / 2,
      z: -1,
      fixed: Fixed.BOTH,
      width,
      height,
      radii: borderRadius,
      fillColor: backgroundColor,
      strokeColor: 'transparent'
    }))

    // add border block
    if (borderWidth > 0 && borderColor && borderColor !== 'transparent') {
      blocks.push(createBlock(BlockType.RECTANGLE, {
        x: width / 2,
        y: height / 2,
        z: 9,
        fixed: Fixed.BOTH,
        width,
        height,
        radii: borderRadius,
        fillColor: 'transparent',
        strokeWidth: borderWidth,
        strokeColor: borderColor
      }))
    }

    return blocks.sort((a, b) => a.z - b.z)
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
    const actualWidth = this.actualWidth = Math.max.apply(null, this.#blocks.map(({ x, width }) => x + width / 2)) + (right ?? 0)

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const actualHeight = this.actualHeight = Math.max.apply(null, this.#blocks.map(({ y, height }) => y + height / 2)) + (bottom ?? 0)

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
      this.#headerBarBlocks = parseHeaderBar(this)
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
      case 'isCollapsed':
        this.#headerBarBlocks = parseHeaderBar(this)
        this.render()
        break
      case 'scrollState':
        this.scrollState = state as Coordinate
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

    this.updateBlocks()
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

  updateBlocks () {
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

    const {
      renderer,
      viewportSize: {
        width,
        height
      },
      viewportBlocks
    } = this

    renderer.init(width, height)

    renderer.render(viewportBlocks)
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

    this.#setState('scrollState', { x, y })

    this.afterRender()
  }

  resize (width: number, height: number) {
    if (width < 0 || height < 0) {
      throw new RangeError('Out of range')
    }

    const isWidthChange = width !== this.width

    Object.assign(this, { width, height })

    this.#init()

    // Should re-parse blocks when resize
    if (this.breakRow) {
      this.#blocks = parseContent(this.content, this.language, this)
    }
    if (isWidthChange) {
      this.#headerBarBlocks = parseHeaderBar(this)
    }

    this.render()
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

    if (this.headerBarSetting.visible) {
      const {
        children = [],
        x: midX,
        y: midY
      } = (this.#headerBarBlocks[0] || {}) as GroupBlock
      const copyBtn = children.find(block => block.id === BTN_COPY_ID)
      const collapseBtn = children.find(block => block.id === BTN_COLLAPSE_ID)

      if (
        copyBtn &&
        midX + copyBtn.x - copyBtn.width / 2 <= x &&
        midX + copyBtn.x + copyBtn.width / 2 >= x &&
        midY + copyBtn.y - copyBtn.height / 2 <= y &&
        midY + copyBtn.y + copyBtn.height / 2 >= y
      ) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleCopy()
      } else if (
        collapseBtn &&
        midX + collapseBtn.x - collapseBtn.width / 2 <= x &&
        midX + collapseBtn.x + collapseBtn.width / 2 >= x &&
        midY + collapseBtn.y - collapseBtn.height / 2 <= y &&
        midY + collapseBtn.y + collapseBtn.height / 2 >= y
      ) {
        this.toggleCollapse()
      } else {
        // Click other blocks
      }
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
    this.#setState('isCollapsed', !this.isCollapsed)
  }

  mount (el: string | Element): CodeViewer {
    const parentElement = isString(el)
      ? document.querySelector<Element>(el)
      : el

    if ((parentElement == null) || !('innerHTML' in parentElement)) {
      throw new TypeError(`'el' expect a Element or a selector, but got '${typeof el}'`)
    }

    const { renderer } = this

    if (!this.width || !this.height) {
      const { width, height } = parentElement.getBoundingClientRect()

      renderer.init(width, height)

      this.width = width
      this.height = height
    }

    // try parse content again
    if (this.#blocks.length === 0 && this.content) {
      this.updateBlocks()
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
