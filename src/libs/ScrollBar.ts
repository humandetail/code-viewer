import { DEFAULT_SCROLL_BAR_STYLE, ScrollBarStyle } from '../config/defaultSetting'
import Renderer from './Renderer'

export enum ScrollBarType {
  horizontal = 'horizontal',
  vertical = 'vertical'
}

export interface ScrollBarOptions {
  type?: ScrollBarType
  style?: ScrollBarStyle
  actualLength: number
  visibleLength: number
}

export default class ScrollBar {
  renderer!: Renderer

  type: ScrollBarType = ScrollBarType.horizontal


  size = DEFAULT_SCROLL_BAR_STYLE.size
  borderColor = DEFAULT_SCROLL_BAR_STYLE.borderColor
  backgroundColor = DEFAULT_SCROLL_BAR_STYLE.backgroundColor
  thumbBackgroundColor = DEFAULT_SCROLL_BAR_STYLE.thumbBackgroundColor

  // content actual length
  actualLength!: number
  // maximum visible length
  visibleLength!: number

  isActive = false

  scrollDistance = 0

  constructor (renderer: Renderer, {
    style,
    type,
    actualLength,
    visibleLength
  }: ScrollBarOptions) {
    Object.assign(this, {
      ...(style ?? {}),
      type,
      actualLength,
      // @todo Space of cross is left only if both bars are active 
      visibleLength: visibleLength - (style?.size ?? 0),
      renderer
    })
  }

  get scale () {
    return this.visibleLength / this.actualLength
  }

  get thumbLength () {
    return this.visibleLength * this.scale
  }

  // scroll bar max scroll distance
  get maxScrollDistance () {
    return this.visibleLength - this.thumbLength
  }

  // wrapper should scroll distance
  get actualScrollDistance () {
    return this.scrollDistance / this.scale
  }

  setState (isActive: boolean) {
    this.isActive = isActive
  }

  show () {
    /**
     * @todo Display
     */
    // const {
    //   type,
    //   size,
    //   scrollDistance,
    //   thumbLength,
    //   visibleLength,
    //   borderColor,
    //   backgroundColor,
    //   thumbBackgroundColor
    // } = this

    // this.renderer.drawScrollBar(
    //   type,
    //   size,
    //   scrollDistance,
    //   thumbLength,
    //   visibleLength,
    //   borderColor,
    //   backgroundColor,
    //   thumbBackgroundColor
    // )
  }

  hide () {}

  scroll (distance: number) {
    
    const { maxScrollDistance } = this
    this.scrollDistance = Math.max(0, Math.min(maxScrollDistance, distance))

    return this.actualScrollDistance
  }

  scrollBy (distance: number) {
    const { scrollDistance, maxScrollDistance } = this

    this.scrollDistance = Math.max(0, Math.min(maxScrollDistance, scrollDistance + distance))

    return this.actualScrollDistance
  }
}
