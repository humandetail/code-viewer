import { type HeaderBar, type BorderStyle, type LineNumberStyle, type Style } from '../config/defaultSetting'
import { type Coordinate } from '../types'
import { isAllTransparent, isAllZero } from '../utils/tools'
import type CodeViewer from './CodeViewer'
import { type Size } from './Measure'
import { type LineNumber, type Row } from './Parser'
import { ScrollBarType } from './ScrollBar'

export default class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  style: Required<Style>

  protected codeViewer!: CodeViewer

  constructor (
    style: Required<Style>,
    codeViewer: CodeViewer,
    public width: number = 0,
    public height: number = 0
  ) {
    const canvas = this.canvas = document.createElement('canvas')
    this.ctx = canvas.getContext('2d')!
    this.style = style
    this.codeViewer = codeViewer

    if (width && height) {
      this.init(width, height)
    }

    this.setCtxStyle(style)
  }

  init (width?: number, height?: number) {
    const { canvas, ctx } = this
    const scale = window.devicePixelRatio || 1
    const w = this.width = width ?? this.width
    const h = this.height = height ?? this.height

    canvas.width = w * scale
    canvas.height = h * scale
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    ctx.scale(scale, scale)
  }

  setCanvasStyle () {
    const {
      ctx,
      style: {
        padding: [top, , , left]
      }
    } = this

    ctx.translate(left, top)
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

  update (rows: Row[], lineNumberStyle?: Required<LineNumberStyle>, coordinate: Coordinate = { x: 0, y: 0 }, headerBar?: HeaderBar) {
    this.clear()
    this.render(rows, lineNumberStyle, coordinate, headerBar)
  }

  render (rows: Row[], lineNumberStyle?: Required<LineNumberStyle>, coordinate: Coordinate = { x: 0, y: 0 }, headerBar?: HeaderBar) {
    this.save()

    const { style, width, height } = this

    this.drawBackground(style.backgroundColor, { width, height }, style.borderRadius)

    // render header bar
    if (headerBar?.visible) {
      this.drawHeaderBar(headerBar)
    }

    this.setCanvasStyle()

    // render code
    rows.forEach(row => {
      this.renderRow(row, coordinate)
    })

    this.restore()

    // render line number
    const { style: { padding } } = this
    const paddingTop = padding[0] ?? 0

    rows.forEach(({ lineNumber }) => {
      if (lineNumber.display) {
        if (!lineNumberStyle) {
          throw new Error('If you want to display the line number, set the line number style.')
        }
        this.save()
        this.translate(0, paddingTop - coordinate.y)
        this.drawLineNumber(lineNumber, lineNumberStyle)
        this.restore()
      }
    })
  }

  afterRender (breakRow: boolean) {
    const {
      style,
      width,
      height
    } = this

    this.save()
    if (!breakRow) {
      // @todo - Should set padding-right when the scroll reach right
    }

    // @todo - Should set padding-bottom when the scroll reach bottom
    this.drawBorder(style, { width, height })
    this.restore()
  }

  renderRow (row: Row, { x, y }: Coordinate = { x: 0, y: 0 }) {
    const { children, top } = row

    this.save()
    this.translate(0, top - y)
    children.forEach(child => {
      this.save()
      this.translate(child.left - x, child.top)
      this.drawText(child.content, child.style)
      this.restore()
    })

    this.restore()
  }

  fillRect (x: number, y: number, w: number, h: number, fill?: string | CanvasGradient | CanvasPattern) {
    const { ctx } = this

    this.save()

    if (fill) {
      ctx.fillStyle = fill
    }

    ctx.fillRect(x, y, w, h)

    this.restore()
  }

  drawHeaderBar ({
    collapsible,
    language,
    canCopy,
    style: {
      padding: [padTop, padRight, padBottom, padLeft],
      borderColor,
      backgroundColor
    }
  }: HeaderBar) {
    const {
      width,
      style: { lineHeight },
      ctx
    } = this
    const height = lineHeight + padTop + padBottom

    const collapseWidgetRadius = 6

    this.fillRect(0, 0, width, height, backgroundColor)

    this.drawHeaderBarCollapseWidget(!!collapsible, padLeft, padTop, collapseWidgetRadius)

    if (language?.visible) {
      this.drawHeaderBarLanguage(language, padLeft + collapseWidgetRadius * 2 + padRight, padTop)
    }

    if (canCopy) {
      this.drawHeaderBarCopyWidget(padRight, padTop + lineHeight / 2, backgroundColor)
    }

    if (borderColor) {
      ctx.beginPath()
      ctx.strokeStyle = borderColor
      ctx.moveTo(0, height)
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.stroke()
    }
  }

  drawHeaderBarCollapseWidget (collapsible: boolean, padLeft: number, padTop: number, r: number) {
    const {
      ctx,
      style: {
        lineHeight
      },
      codeViewer: {
        collapsed
      }
    } = this

    this.save()

    ctx.translate(padLeft + r, padTop + lineHeight / 2)
    ctx.beginPath()
    ctx.fillStyle = '#62c655'
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    if (collapsible) {
      if (collapsed) {
        ctx.beginPath()
        ctx.moveTo(0, 3 - r)
        ctx.lineTo(3 - r, -1)
        ctx.lineTo(r - 3, -1)
        ctx.closePath()
        ctx.fillStyle = '#555'
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(0, r - 3)
        ctx.lineTo(3 - r, 1)
        ctx.lineTo(r - 3, 1)
        ctx.closePath()
        ctx.fillStyle = '#555'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(0, -1)
        ctx.lineTo(3 - r, 3 - r)
        ctx.lineTo(r - 3, 3 - r)
        ctx.closePath()
        ctx.fillStyle = '#555'
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(0, 1)
        ctx.lineTo(3 - r, r - 3)
        ctx.lineTo(r - 3, r - 3)
        ctx.closePath()
        ctx.fillStyle = '#555'
        ctx.fill()
      }
    } else {
      ctx.beginPath()
      ctx.fillStyle = '#333'
      ctx.arc(0, 0, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    this.restore()
  }

  drawHeaderBarLanguage (language: HeaderBar['language'], x: number, y: number) {
    const {
      codeViewer,
      style
    } = this

    if (!language) {
      return
    }

    this.save()
    this.translate(x, y)

    this.drawText(codeViewer.language, {
      ...style,
      color: language.color,
      fontSize: language.fontSize
    })

    this.restore()
  }

  drawHeaderBarCopyWidget (right: number, y: number, backgroundColor: string) {
    const {
      ctx,
      width,
      style: {
        lineHeight,
        color
      },
      codeViewer: {
        copyState
      }
    } = this

    this.save()

    switch (copyState) {
      case 'Success':
      case 'Failure':
        this.translate(width - right, y - lineHeight / 2)
        ctx.textAlign = 'right'
        this.drawText(copyState, {
          ...this.style,
          color: copyState === 'Success' ? 'green' : 'red'
        })
        break

      case 'Default':
      default:
        this.translate(width - right - lineHeight / 2, y)

        ctx.strokeStyle = color
        ctx.fillStyle = backgroundColor

        ctx.beginPath()
        ctx.globalAlpha = 0.5
        ctx.roundRect(-lineHeight / 2, -3, lineHeight / 2 + 3, lineHeight / 2 + 3, 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.fillRect(-5, -lineHeight / 2, lineHeight / 2 + 5, lineHeight / 2 + 5)

        ctx.beginPath()
        ctx.globalAlpha = 0.5
        ctx.roundRect(-3, -lineHeight / 2, lineHeight / 2 + 3, lineHeight / 2 + 3, 2)
        ctx.stroke()
        ctx.fill()
        break
    }

    this.restore()
  }

  drawLineNumber (
    {
      value,
      width,
      height,
      top,
      left
    }: LineNumber,
    { borderColor, padding }: Required<LineNumberStyle>
  ) {
    const { ctx, style } = this

    this.save()

    this.translate(left, top)

    this.drawBackground(style.backgroundColor, { width, height })
    this.drawBorder({
      ...this.style,
      borderColor,
      borderWidth: [0, 1, 0, 0],
      borderStyle: 'solid',
      borderRadius: 0
    }, { width, height })

    ctx.translate(
      width - (padding ?? 0),
      0
    )
    ctx.textAlign = 'right'
    this.drawText(value, this.style)

    this.restore()
  }

  drawText (text: string | number, style: Required<Style>) {
    const { ctx } = this

    ctx.save()
    this.setCtxStyle(style)
    ctx.textBaseline = 'middle'
    ctx.translate(0, style.lineHeight / 2)
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

    console.log({
      width,
      height,
      rightWidth,
      bottomWidth
    })

    this.drawLine([0, 0 + topWidth / 2], [width, 0 + topWidth / 2], topWidth, topStyle, topColor, borderRadius, 'top')
    this.drawLine([width - rightWidth / 2, 0], [width - rightWidth / 2, height], rightWidth, rightStyle, rightColor, borderRadius, 'right')
    this.drawLine([width, height - bottomWidth / 2], [0, height - bottomWidth / 2], bottomWidth, bottomStyle, bottomColor, borderRadius, 'bottom')
    this.drawLine([0 + leftWidth / 2, height], [0 + leftWidth / 2, 0], leftWidth, leftStyle, leftColor, borderRadius, 'left')
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

  // ---------- start scroll bar -----------
  drawScrollBar (
    type: ScrollBarType,
    size: number,
    scrollDistance: number,
    thumbLength: number,
    visibleLength: number,
    borderColor: string,
    backgroundColor: string,
    thumbBackgroundColor: string
  ) {
    const { ctx } = this

    this.save()
    ctx.fillStyle = backgroundColor
    ctx.strokeStyle = borderColor

    if (type === ScrollBarType.horizontal) {
      this.drawHorizontalScrollBar(size, visibleLength, scrollDistance, thumbLength, thumbBackgroundColor)
    } else {
      this.drawVerticalScrollBar(size, visibleLength, scrollDistance, thumbLength, thumbBackgroundColor)
    }

    this.restore()
  }

  drawHorizontalScrollBar (
    size: number,
    visibleLength: number,
    scrollDistance: number,
    thumbLength: number,
    thumbBackgroundColor: string
  ) {
    const { ctx, height } = this

    this.translate(0, height - size)
    // border
    ctx.strokeRect(0, 0, visibleLength, size)
    // background
    ctx.fillRect(0, 0, visibleLength, size)
    // thumb
    ctx.fillStyle = thumbBackgroundColor
    ctx.fillRect(scrollDistance, 0, thumbLength, size)
  }

  drawVerticalScrollBar (
    size: number,
    visibleLength: number,
    scrollDistance: number,
    thumbLength: number,
    thumbBackgroundColor: string
  ) {
    const { ctx, width } = this

    this.translate(width - size, 0)
    // border
    ctx.strokeRect(0, 0, size, visibleLength)
    // background
    ctx.fillRect(0, 0, size, visibleLength)
    // thumb
    ctx.fillStyle = thumbBackgroundColor
    ctx.fillRect(0, scrollDistance, size, thumbLength)
  }
  // ---------- end scroll bar -----------

  /**
   * get Mouse point current position
   * @todo - row | lineNumber
   * @returns btn-collapse | btn-copy | other
   */
  getMousePosition ({ x, y }: Coordinate): 'btn-collapse' | 'btn-copy' | 'other' {
    const {
      codeViewer: {
        headerBar
      },
      style: {
        lineHeight
      },
      width
    } = this

    if (headerBar.visible) {
      const {
        style: {
          padding: [top, right, , left]
        }
      } = headerBar
      if (headerBar.canCopy) {
        const [x1, y1, x2, y2] = [
          width - right - lineHeight,
          top,
          width - right,
          top + lineHeight
        ]
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          return 'btn-copy'
        }
      }
      if (headerBar.collapsible) {
        const [x1, y1, x2, y2] = [
          left,
          top,
          left + 12,
          top + 12
        ]
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          return 'btn-collapse'
        }
      }
    }

    return 'other'
  }

  translate (x: number, y: number) {
    this.ctx.translate(x, y)
  }

  save () {
    this.ctx.save()
  }

  restore () {
    this.ctx.restore()
  }

  clear () {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }
}
