import { BorderStyle, Style } from '../config/defaultSetting'
import { isAllTransparent, isAllZero } from '../utils/tools'
import { Size } from './Measure'
import { LineNumber, Row } from './Parser'

export default class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  style: Required<Style>

  constructor (
    style: Required<Style>,
    public width: number = 0,
    public height: number = 0,
  ) {
    const canvas = this.canvas = document.createElement('canvas')
    this.ctx = canvas.getContext('2d')!

    this.style = style

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
      style,
      width,
      height
    } = this

    this.drawBackground(style.backgroundColor, { width, height }, style.borderRadius)

    const [top, , , left] = style.padding

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

  render (rows: Row[], lineNumberStyle?: Required<Style>, breakRow?: boolean) {
    this.save()

    this.setCanvasStyle()

    rows.forEach(row => {
      this.renderRow(row, lineNumberStyle)
    })

    this.restore()

    this.afterRender(!!breakRow)
  }

  afterRender (breakRow: boolean) {
    const {
      style,
      width,
      height,
    } = this

    this.save()
    if (!breakRow) {
      // @todo - Should set padding-right when the scroll reach right
    }

    // @todo - Should set padding-bottom when the scroll reach bottom
    this.drawBorder(style, { width, height })
    this.restore()
  }

  renderRow (row: Row, lineNumberStyle?: Required<Style>) {
    const { children, lineNumber, top } = row

    if (lineNumber.display) {
      if (!lineNumberStyle) {
        throw new Error('If you want to display the line number, set the line number style.')
      }
      this.drawLineNumber(lineNumber, lineNumberStyle)
    }

    this.save()
    this.translate(0, top)
    children.forEach(child => {
      this.save()
      this.translate(child.left, child.top)
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

  drawLineNumber (
    {
      value,
      width,
      height,
      top,
      left
    }: LineNumber,
    style: Required<Style>
  ) {
    const { ctx } = this

    this.save()

    this.translate(left, top)

    this.drawBackground(style.backgroundColor, { width, height })
    this.drawBorder(style, { width, height })

    ctx.translate(
      width - (style.padding[1] ?? 0),
      0
    )
    ctx.textAlign = 'right'
    this.drawText(value, style)

    this.restore()
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

  translate (x: number, y: number) {
    this.ctx.translate(x, y)
  }

  save () {
    this.ctx.save()
  }

  restore () {
    this.ctx.restore()
  }
}