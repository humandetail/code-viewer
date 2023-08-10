/**
 * Code Renderer
 */

import { DEFAULT_CURSOR_STYLE, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SELECT_STYLE, DEFAULT_STYLE, DEFAULT_THEME_OPTIONS, type Style, type ThemeOptions } from '../config/defaultSetting'
import { deepMergeObject, isEmptyObject, isString } from '../utils/tools'
import Renderer from './Renderer'
import { Row, parseContent } from './Parser'

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
}

export default class CodeViewer {
  renderer: Renderer

  width = 0
  height = 0
  style = DEFAULT_STYLE
  selectStyle = DEFAULT_SELECT_STYLE
  cursorStyle = DEFAULT_CURSOR_STYLE
  lineNumberStyle = DEFAULT_LINE_NUMBER_STYLE

  displayLineNumber = true
  wrap = false
  selectable = true
  breakRow = true

  themes: ThemeOptions = DEFAULT_THEME_OPTIONS

  #isMounted = false

  rows: Row[] = []

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

  #init () {}

  setThemes (themes: ThemeOptions): CodeViewer {
    Object.entries(themes).forEach(([prop, value]) => {
      this.setTheme(value, prop as keyof ThemeOptions)
    })

    this.rows.forEach(row => {
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

    if (scope.includes('.')) {
      const s = scope.split('.').reduce<Style>((prev, key) => {
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
      this.rows = parseContent(
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
      this.rows = []
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

    this.renderer.render(this.rows, this.lineNumberStyle)

    return this
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
