/**
 * Code Renderer
 */

import { DEFAULT_CURSOR_STYLE, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SELECT_STYLE, DEFAULT_STYLE, DEFAULT_THEME_OPTIONS, type Style, type ThemeOptions } from '../config/defaultSetting'
import { deepMergeObject, isEmptyObject, isString } from '../utils/tools'
import Renderer from './Renderer'
import { type Row, parseContent } from './Parser'
import ScrollBar, { ScrollBarType } from './ScrollBar'
import { type Coordinate } from '../types'

type Overflow = 'auto' | 'hidden' | 'scroll'
export interface ViewerOptions {
  content?: string
  // code language
  language?: string

  width?: number
  height?: number
  /** base style */
  style?: Style
  selectStyle?: Style
  cursorStyle?: Style
  lineNumberStyle?: Style

  displayLineNumber?: boolean
  wrap?: boolean
  selectable?: boolean
  breakRow?: boolean
  overflowX?: Overflow
  overflowY?: Overflow
}

export default class CodeViewer {
  renderer: Renderer

  width = 0
  height = 0
  actualWidth = 0
  actualHeight = 0

  style = DEFAULT_STYLE
  selectStyle = DEFAULT_SELECT_STYLE
  cursorStyle = DEFAULT_CURSOR_STYLE
  lineNumberStyle = DEFAULT_LINE_NUMBER_STYLE

  displayLineNumber = true
  wrap = false
  selectable = true
  breakRow = true

  // If overflowX is `auto` and breakRow is false.
  // The canvas width will follow the maximum width of the row.
  // If overflowX is `scroll` and breakRow is false.
  // A horizontal scroll bar will be displayed.
  overflowX: Overflow = 'auto'
  overflowY: Overflow = 'auto'

  themes: ThemeOptions = DEFAULT_THEME_OPTIONS

  #isMounted = false

  #rows: Row[] = []

  horizontalScrollBar!: ScrollBar
  verticalScrollBar!: ScrollBar

  constructor ({ content, language, ...options }: ViewerOptions = {}, themes: ThemeOptions = {}) {
    deepMergeObject(this, options)

    this.setThemes(themes)

    this.updateRows(content, language)

    this.renderer = new Renderer(
      this.style,
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

  #init (initEvent = false) {
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
  }

  setThemes (themes: ThemeOptions): CodeViewer {
    Object.entries(themes).forEach(([prop, value]) => {
      this.setTheme(value, prop as keyof ThemeOptions)
    })

    this.#rows.forEach(row => {
      row.children.forEach(item => {
        item.style = this.getScopeStyle(item.scope as keyof ThemeOptions)
      })
    })

    return this
  }

  setTheme (value: Style, prop: keyof ThemeOptions): CodeViewer {
    this.themes[prop] = {
      ...this.themes[prop],
      ...value
    }

    return this
  }

  getScopeStyle (scope: keyof ThemeOptions): Required<Style> {
    const { themes, style } = this

    if (!scope) {
      return style
    }

    const fullScopeStyle = themes[scope] as Required<Style>

    if ((scope as string).includes('.')) {
      const s = (scope as string).split('.').reduce<Style>((prev, key) => {
        const s = themes[key as keyof ThemeOptions] as Required<Style>
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

  update (content?: string, language?: string) {
    if (!this.#isMounted) {
      throw new Error('Make sure the `mount()` method is called first.')
    }

    this.updateRows(content, language)
    /** @todo */
    this.#init(false)

    this.horizontalScrollBar.scroll(0)
    this.verticalScrollBar.scroll(0)
    this.renderer.update(this.#rows, this.lineNumberStyle, { x: 0, y: 0 })
  }

  updateRows (content?: string, language?: string) {
    if (content) {
      const {
        width,
        style: {
          padding,
          lineHeight
        },
        breakRow,
        displayLineNumber,
        lineNumberStyle
      } = this
      this.#rows = parseContent(
        content,
        language,
        breakRow,
        displayLineNumber,
        lineNumberStyle,
        width - (padding[1] ?? 0) - (padding[3] ?? 0), // max content render width
        lineHeight,
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

    this.renderer.render(this.#rows, this.lineNumberStyle, { x: 0, y: 0 })
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
