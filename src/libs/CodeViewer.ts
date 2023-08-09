/**
 * Code Renderer
 */

import hljs from 'highlight.js'
import { BorderStyle, DEFAULT_CURSOR_STYLE, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SELECT_STYLE, DEFAULT_STYLE, DEFAULT_THEME_OPTIONS, Style, ThemeOptions } from '../config/defaultSetting'
import { LF_Regex, deepMergeObject, isAllTransparent, isAllZero, isEmptyObject, isString, splitLF } from '../utils/tools'
import { Size, getMaxRenderIndex, getTextSize } from './Measure'

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

  showLineNumber?: boolean
  wrap?: boolean
  selectable?: boolean
  breakRow?: boolean
}

export interface ScopeData {
  scope: string
  children: (string | ScopeData)[]
}

interface FlatData {
  content: string
  scope?: string
}

export interface InlineItem {
  content: string
  style: Required<Style>
  size: Size
  scope?: string
}

export interface Row extends Size {
  lineNumber: number
  children: InlineItem[]
  top: number
}

export default class CodeViewer {
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D

  width = 0
  height = 0
  style = DEFAULT_STYLE
  selectStyle = DEFAULT_SELECT_STYLE
  cursorStyle = DEFAULT_CURSOR_STYLE
  lineNumberStyle = DEFAULT_LINE_NUMBER_STYLE

  showLineNumber = true
  wrap = false
  selectable = true
  breakRow = true

  themes: ThemeOptions = DEFAULT_THEME_OPTIONS

  #isMounted = false

  rows: Row[] = []

  /** Max line number width */
  lineNumberWidth = 0
  /** Last render line top */
  lastRenderTop = 0

  constructor ({ content, language, ...options }: ViewerOptions = {}, themes: ThemeOptions = {}) {
    deepMergeObject(this, options)

    this.setThemes(themes)

    if (content) {
      this.parseContent(content, language)
    }

    this.#init()
  }

  get maxContentWidth () {
    const {
      width,
      style: {
        padding: [_, right]
      },
      breakRow
    } = this

    if (!breakRow) {
      return Infinity
    }

    return width - right
  }

  #init () {
    const canvas = this.canvas = document.createElement('canvas')
    this.ctx = canvas.getContext('2d')!

    const {
      width,
      height,
      style
    } = this

    this.setCtxStyle(style)

    if (width && height) {
      this.#initCanvas()
    }
  }

  #initCanvas (width?: number, height?: number) {
    const { canvas, ctx } = this
    const scale = window.devicePixelRatio || 1
    const w = width || this.width
    const h = height || this.height

    canvas.width = w * scale
    canvas.height = h * scale
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    ctx.scale(scale, scale)
  }

  setThemes (themes: ThemeOptions): CodeViewer {
    Object.entries(themes).forEach(([prop, value]) => {
      this.setTheme(value, prop as keyof ThemeOptions)
    })
    // this.themes = {
    //   ...this.themes,
    //   ...themes
    // }

    this.rows.forEach(row => {
      row.children.forEach(item => {
        item.style = this.getScopeStyle(item.scope as keyof ThemeOptions)
      })
    })

    return this
  }

  setTheme (value: Style, prop: keyof ThemeOptions): CodeViewer {
    // this.setThemes({ [prop]: style })
    this.themes[prop] = {
      ...this.themes[prop],
      ...value
    }

    return this
  }

  setCtxStyle ({
    color,
    // backgroundColor,
    fontSize,
    lineHeight,
    fontWeight,
    fontStyle,
    fontFamily,
    opacity
  }: Required<Style>) {
    const { ctx } = this

    ctx.fillStyle = color
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight}px ${fontFamily}`
    ctx.globalAlpha = Math.max(1, Math.min(0, opacity))
  }

  getScopeStyle (scope: keyof ThemeOptions): Required<Style> {
    const { themes, style } = this

    if (!scope) {
      return style
    }
      
    const fullScopeStyle = themes[scope] as Required<Style>

    if (scope.includes('.')) {
      const s = scope.split('.').reduce((prev, key) => {
        const s = themes[key as keyof ThemeOptions] as Required<Style>
        if (s) {
          Object.assign(prev, s)
        }

        return prev
      }, {} as Style)

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

  /**
   * @param content - code string
   * @param language - hljs.listLanguages()
   */
  parseContent (content: string, language = 'Plain text') {
    const scopeDataList = (hljs.highlight(content, {
      language
    }) as any)._emitter.rootNode.children as ScopeData[]

    this.mergeData(this.flatScopeDataList(scopeDataList))
  }

  flatScopeDataList (scopeDataList: (string | ScopeData)[], scope?: string): FlatData[] {
    return scopeDataList.reduce((prev: FlatData[], item) => {
      return prev.concat(
        isString(item)
          ? { content: item, scope }
          : this.flatScopeDataList(item.children, item.scope)
      )
    }, [])
  }

  mergeData (list: FlatData[]) {
    let lineNumber = 1
    let children: InlineItem[] = []

    const rows: Row[] = []

    const { breakRow, width, style: { lineHeight, padding } } = this

    list.forEach(({ scope, content }) => {
      const currentStyle = this.getScopeStyle(scope as keyof ThemeOptions)

      if (LF_Regex.test(content)) {
        splitLF(content).forEach((item, index, sourceArr) => {
          children.push({
            scope,
            content: item,
            style: currentStyle,
            size: getTextSize(item, currentStyle)
          })

          if (sourceArr[index + 1] !== undefined) {
            rows.push({
              top: 0,
              lineNumber: lineNumber++,
              children,
              width: breakRow
                ? width - (padding[1] ?? 0) - (padding.at(-1) ?? 0)
                : children.reduce((w, i) => w + i.size.width, 0),
              height: lineHeight
            })

            children = []
          }
        })
      } else {
        children.push({
          scope,
          content,
          style: currentStyle,
          size: getTextSize(content, currentStyle)
        })
      }
    })

    if (children.length !== 0) {
      rows.push({
        top: 0,
        lineNumber: lineNumber++,
        children,
        width: breakRow
          ? width - (padding[1] ?? 0) - (padding.at(-1) ?? 0)
          : children.reduce((w, i) => w + i.size.width, 0),
        height: lineHeight
      })
    }

    this.rows = rows
  }

  update (content?: string, language?: string) {
    if (!this.#isMounted) {
      throw new Error('Make sure the `mount()` method is called first.')
    }

    if (content) {
      this.parseContent(content, language)
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

    const { ctx } = this

    ctx.save()

    this.setWrapperStyle()

    const { rows, showLineNumber, lineNumberStyle } = this

    if (showLineNumber) {
      const maxNumber = Math.max.apply(null, rows.map(({ lineNumber }) => lineNumber))
      const { width } = getTextSize(`${maxNumber}`, lineNumberStyle)
      this.lineNumberWidth = width
    }

    rows.forEach(row => {
      this.renderRow(row)
    })

    ctx.restore()

    // after render
    this.afterRender()

    return this
  }

  setWrapperStyle () {
    const {
      ctx,
      style,
      width,
      height
    } = this

    this.drawBackground(style.backgroundColor, { width, height }, style.borderRadius)

    const [top, _1, _2, left] = style.padding

    ctx.translate(left, top)
  }

  afterRender () {
    const {
      ctx,
      style,
      width,
      height,
      breakRow
    } = this

    const {
      padding: [_, right, _bottom],
      backgroundColor
    } = style

    ctx.save()
    if (breakRow) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(width - right, 0, right, height)
    } else {
      // @todo - Should set padding-right when the scroll reach right
    }

    // @todo - Should set padding-bottom when the scroll reach bottom
    this.drawBorder(style, { width, height })
    ctx.restore()
  }

  renderRow (row: Row) {
    const {
      ctx,
      showLineNumber,
      lineNumberWidth,
      lineNumberStyle,
      lastRenderTop,
      maxContentWidth,
      style: {
        lineHeight,
        padding
      }
    } = this

    row.top = lastRenderTop

    ctx.save()

    ctx.translate(0, lastRenderTop)

    if (showLineNumber) {
      // this.drawLineNumber(row.lineNumber)
      ctx.translate(
        // margin-left
        (lineNumberStyle.margin[1] ?? 0) +
        // padding-left
        (lineNumberStyle.padding[1] ?? 0) +
        // max line number width
        lineNumberWidth +
        // padding-right
        (lineNumberStyle.padding.at(-1) ?? 0) +
        // margin-right
        (lineNumberStyle.margin.at(-1) ?? 0)
        , 0
      )
    }

    const children = [...row.children]
    let item: InlineItem

    for (let i = 0; i < children.length; i++) {
      item = children[i]

      const { content, style, size: { width } } = item
      const currentTranslateX = ctx.getTransform().e / window.devicePixelRatio
      const restWidth = maxContentWidth - (currentTranslateX + width)

      if (restWidth < 0) {
        // If the next render is going to be out of range,
        // first render part of the content that is sufficient to render,
        // and then move the rest to the next item.

        const idx = getMaxRenderIndex(content, style, restWidth + width)

        const newContent = content.slice(0, idx)
        const nextContent = content.slice(idx)

        children.splice(i, 1, {
          ...item,
          content: newContent
        }, {
          ...item,
          content: nextContent
        })

        this.drawText(newContent, style)

        ctx.translate(
          -currentTranslateX + (padding.at(-1) ?? 0),
          lineHeight
        )
        if (showLineNumber) {
          ctx.translate(
            // margin-left
            (lineNumberStyle.margin[1] ?? 0) +
            // padding-left
            (lineNumberStyle.padding[1] ?? 0) +
            // max line number width
            lineNumberWidth +
            // padding-right
            (lineNumberStyle.padding.at(-1) ?? 0) +
            // margin-right
            (lineNumberStyle.margin.at(-1) ?? 0)
            , 0
          )
        }

        this.lastRenderTop += lineHeight
        row.height += lineHeight
      } else {
        this.drawText(content, style)
  
        ctx.translate(width, 0)
      }
    }

    ctx.restore()

    if (showLineNumber) {
      ctx.save()
      ctx.translate(0, row.top)
      this.drawLineNumber(row.lineNumber, row.height)
      ctx.restore()
    }

    this.lastRenderTop += this.style.lineHeight
  }

  drawLineNumber (lineNumber: number, height: number) {
    const {
      ctx,
      lineNumberStyle
    } = this

    ctx.save()

    const size: Size = {
      width: (
        // padding-left
        (lineNumberStyle.padding[1] ?? 0) +
        // max line number width
        this.lineNumberWidth +
        // padding-right
        (lineNumberStyle.padding.at(-1) ?? 0)
      ),
      height,
    }

    this.drawBackground(lineNumberStyle.backgroundColor, size)
    this.drawBorder(lineNumberStyle, size)

    ctx.translate(
      // margin-left
      (lineNumberStyle.margin.at(-1) ?? 0)
      // padding-left
      + (lineNumberStyle.padding.at(-1) ?? 0)
      + this.lineNumberWidth,
      0
    )
    ctx.textAlign = 'right'
    this.drawText(lineNumber, lineNumberStyle)

    ctx.restore()
  }

  drawText (text: string | number, style: Required<Style>) {
    const { ctx } = this
    
    ctx.save()
    ctx.textBaseline = 'top'
    this.setCtxStyle(style)
    ctx.fillText(`${text}`, 0, 0)
    ctx.restore()
  }

  drawBorder (
    {
      borderColor,
      borderWidth,
      borderStyle,
      borderRadius
    }: Required<Style>,
    {
      width,
      height
    }: Size
  ) {
    if (isAllZero(borderWidth) || isAllTransparent(borderColor)) {
      return
    }

    const [topWidth, rightWidth, bottomWidth, leftWidth] = typeof borderWidth === 'number'
      ? Array(4).fill(borderWidth) as [number, number, number, number]
      : borderWidth
    const [topColor, rightColor, bottomColor, leftColor] = typeof borderColor === 'string'
      ? Array(4).fill(borderColor) as [string, string, string, string]
      : borderColor
    const [topStyle, rightStyle, bottomStyle, leftStyle] = typeof borderStyle === 'string'
    ? Array(4).fill(borderStyle) as [BorderStyle, BorderStyle, BorderStyle, BorderStyle]
    : borderStyle

    this.drawLine([0, 0], [width, 0], topWidth, topStyle, topColor, borderRadius, 'top')
    this.drawLine([width - rightWidth / 2, 0], [width - rightWidth / 2, height], rightWidth, rightStyle, rightColor, borderRadius, 'right')
    this.drawLine([width, height - bottomWidth / 2], [0, height - bottomWidth / 2], bottomWidth, bottomStyle, bottomColor, borderRadius, 'bottom')
    this.drawLine([0, height], [0, 0], leftWidth, leftStyle, leftColor, borderRadius, 'left')
  }

  drawLine (
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    lineWidth: number,
    lineStyle: BorderStyle,
    lineColor: string,
    borderRadius = 0,
    ori: 'top' | 'right' | 'bottom' | 'left' = 'top'
  ) {
    if (isAllZero(lineWidth) || isAllTransparent(lineColor)) {
      return
    }

    const { ctx } = this

    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.fillStyle = 'transparent'
    ctx.lineWidth = lineWidth

    switch (lineStyle) {
      case 'dashed':
        ctx.setLineDash([4])
        break
      case 'dotted':
        ctx.setLineDash([1])
        break
      case 'solid':
      default:
        ctx.setLineDash([])
        break
    }

    if (!borderRadius) {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    } else {
      ctx.lineJoin = 'round'
      switch (ori) {
        case 'top':
          ctx.moveTo(x1, y1 + borderRadius)
          ctx.quadraticCurveTo(x1, y1, x1 + borderRadius, y1)
          ctx.lineTo(x2 - borderRadius, y2)
          ctx.quadraticCurveTo(x2, y2, x2, y2 + borderRadius)
          break
        case 'bottom':
          ctx.moveTo(x1, y1 - borderRadius)
          ctx.quadraticCurveTo(x1, y1, x1 - borderRadius, y1)
          ctx.lineTo(x2 + borderRadius, y2)
          ctx.quadraticCurveTo(x2, y2, x2, y2 - borderRadius)
          break
        case 'right':
          ctx.moveTo(x1 - borderRadius, y1)
          ctx.quadraticCurveTo(x1, y1, x1, y1 + borderRadius)
          ctx.lineTo(x2, y2 - borderRadius)
          ctx.quadraticCurveTo(x2, y2, x2 - borderRadius, y2)
          break
        case 'left':
          ctx.moveTo(x1 + borderRadius, y1)
          ctx.quadraticCurveTo(x1, y1, x1, y1 - borderRadius)
          ctx.lineTo(x2, y2 + borderRadius)
          ctx.quadraticCurveTo(x2, y2, x2 + borderRadius, y2)
          break
      }
    }
    ctx.stroke()

    ctx.closePath()
    ctx.restore()
  }

  drawBackground (color: string, { width, height }: Size, radii = 0) {
    const { ctx } = this
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.roundRect(0, 0, width, height, radii)
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }

  mount (el: string | Element): CodeViewer {
    const parentElement = isString(el)
      ? document.querySelector<Element>(el)
      : el
    
    if (!parentElement || !('innerHTML' in parentElement)) {
      throw new TypeError(`'el' expect a Element or a string, but got '${el}'`)
    }

    if (!this.width || !this.height) {
      const { width, height } = parentElement.getBoundingClientRect()

      this.width = width
      this.height = height
    }

    this.#initCanvas()

    parentElement.appendChild(this.canvas)

    this.#isMounted = true

    return this
  }

  unmount () {
    this.canvas.remove()
  }
}
