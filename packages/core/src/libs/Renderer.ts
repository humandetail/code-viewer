import { type Style } from '../config/defaultSetting'
import type { Color, Shadow } from '../types'
import { type Block, BlockType, type TextBlock, type LineBlock, type RectangleBlock, type CircleBlock, type GroupBlock, Fixed } from './Block'
import type CodeViewer from './CodeViewer'
import { ScrollBarType } from './ScrollBar'

export default class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  protected codeViewer!: CodeViewer

  constructor (
    codeViewer: CodeViewer,
    public width: number = 0,
    public height: number = 0
  ) {
    const canvas = this.canvas = document.createElement('canvas')
    this.ctx = canvas.getContext('2d')!
    this.codeViewer = codeViewer

    if (width && height) {
      this.init(width, height)
    }

    this.setCtxStyle(codeViewer.style)
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
      codeViewer: {
        style: {
          padding: [top, , , left]
        }
      }
    } = this

    ctx.translate(left, top)
  }

  setCtxStyle ({
    color,
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
    ctx.globalAlpha = Math.min(1, Math.max(0, opacity))
  }

  setPositionFixed ({
    fixed
  }: Block) {
    const {
      codeViewer: {
        scrollState: {
          x,
          y
        }
      }
    } = this

    switch (fixed) {
      case Fixed.BOTH:
        this.translate(0, 0)
        break
      case Fixed.LEFT:
        this.translate(0, -y)
        break
      case Fixed.RIGHT:
        // @todo - fixed right
        break
      default:
        this.translate(-x, -y)
        break
    }
  }

  setShadow ({
    color,
    blur,
    offsetX,
    offsetY
  }: Shadow) {
    const { ctx } = this

    ctx.shadowColor = color
    ctx.shadowBlur = blur
    ctx.shadowOffsetX = offsetX ?? 0
    ctx.shadowOffsetY = offsetY ?? 0
  }

  render (blocks: Block[]) {
    this.clear()

    blocks.forEach(block => {
      this.save()
      this.setPositionFixed(block)

      this.renderBlock(block)
      this.restore()
    })
  }

  renderBlock (block: Block) {
    switch (block.type) {
      case BlockType.GROUP:
        this.renderGroupBlock(block)
        break
      case BlockType.TEXT:
        this.drawTextBlock(block)
        break
      case BlockType.LINE:
        this.drawLineBlock(block)
        break
      case BlockType.RECTANGLE:
        this.drawRectBlock(block)
        break
      case BlockType.CIRCLE:
        this.drawCircleBlock(block)
        break
      default:
        break
    }
  }

  renderGroupBlock (block: GroupBlock) {
    block.children.forEach(b => {
      this.save()
      this.rotate(block.x, block.y, block.angle)
      this.renderBlock(b)
      this.restore()
    })
  }

  drawTextBlock ({
    text,
    x,
    y,
    width,
    height,
    angle,
    fontSize,
    fontStyle,
    fontWeight,
    fontFamily,
    lineHeight,
    textAlign,
    textBaseLine,
    opacity,
    fillColor,
    strokeColor,
    shadow
  }: TextBlock) {
    const { ctx } = this

    if (!text) return

    this.save()
    // set rotate
    this.rotate(x, y, angle)
    // fixed text align & text base line
    this.translate(
      textAlign === 'center'
        ? 0
        : textAlign === 'right'
          ? width / 2
          : -width / 2,
      textBaseLine === 'middle'
        ? 0
        : textBaseLine === 'bottom'
          ? height / 2
          : -height / 2
    )

    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseLine
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight}px ${fontFamily}`
    ctx.globalAlpha = Math.max(1, Math.min(0, opacity))

    if (shadow) {
      this.setShadow(shadow)
    }

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fillText(text, 0, 0)
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.strokeText(text, 0, 0)
    }

    this.restore()
  }

  drawLineBlock ({
    points,
    x,
    y,
    angle,
    strokeWidth,
    strokeColor,
    fillColor
  }: LineBlock) {
    const { ctx } = this

    this.save()

    ctx.beginPath()

    this.rotate(x, y, angle)

    points.forEach((point, index) => {
      ctx[index === 0 ? 'moveTo' : 'lineTo'](point.x, point.y)
    })

    if (strokeColor) {
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = strokeColor
      ctx.stroke()
    }

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }

    this.restore()
  }

  drawRectBlock ({
    x,
    y,
    angle,
    width,
    height,
    fillColor,
    strokeColor,
    strokeWidth,
    radii,
    shadow
  }: RectangleBlock) {
    const { ctx } = this

    this.save()

    this.rotate(x, y, angle)

    ctx.beginPath()

    if (shadow) {
      this.setShadow(shadow)
    }

    ctx.roundRect(-width / 2, -height / 2, width, height, radii)

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }

    this.restore()
  }

  drawCircleBlock ({
    x,
    y,
    angle,
    fillColor,
    strokeColor,
    strokeWidth,
    radius,
    shadow
  }: CircleBlock) {
    const { ctx } = this

    this.save()

    ctx.beginPath()

    if (shadow) {
      this.setShadow(shadow)
    }

    ctx.rotate(angle * Math.PI / 180)

    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }

    this.restore()
  }

  // ---------- start scroll bar -----------
  drawScrollBar (
    type: ScrollBarType,
    size: number,
    scrollDistance: number,
    thumbLength: number,
    visibleLength: number,
    borderColor: Color,
    backgroundColor: Color,
    thumbBackgroundColor: Color
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
    thumbBackgroundColor: Color
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
    thumbBackgroundColor: Color
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

  translate (x: number, y: number) {
    this.ctx.translate(x, y)
  }

  /**
   * set ctx rotate
   * @param x - center x
   * @param y - center y
   * @param angle - degree
   */
  rotate (x: number, y: number, angle = 0) {
    this.translate(x, y)
    this.ctx.rotate(angle * Math.PI / 180)
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
