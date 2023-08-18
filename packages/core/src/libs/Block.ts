import { DEFAULT_STYLE } from '../config/defaultSetting'
import type { Color, Coordinate, FontStyle, MarkRequired, MergeRecord, Point, Radii, Shadow, TextAlign, TextBaseLine } from '../types'
import { type Size } from './Measure'

export enum Fixed {
  UNSET = 'unset',
  BOTH = 'both',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum BlockType {
  GROUP = 'group',
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line'
}

/**
 * @member x - center x
 * @member y - center y
 */
interface BaseBlockOptions extends Coordinate, Size {
  fixed?: Fixed
  z?: number
  opacity?: number
  /** Range 0 of 360 */
  angle?: number

  strokeWidth?: number
  strokeColor?: Color
  fillColor?: Color

  shadow?: Shadow
}

export interface TextBlockOptions {
  text: string
  textAlign?: TextAlign
  textBaseLine?: TextBaseLine
  fontSize?: number
  fontWeight?: number | string
  fontFamily?: string
  fontStyle?: FontStyle
  lineHeight?: number
}

export interface RectangleBlockOptions {
  radii?: Radii
}

export interface LineBlockOptions extends Partial<Pick<CanvasRenderingContext2D, 'lineCap' | 'lineDashOffset' | 'lineJoin' | 'lineWidth'>> {
  points: Point[]
}

export interface CircleBlockOptions {
  radius: number
}

export interface GroupBlockOptions {
  children: Block[]
}

export type TextBlock = { type: BlockType.TEXT } & MarkRequired<MergeRecord<BaseBlockOptions, TextBlockOptions>, 'shadow'>
export type RectangleBlock = { type: BlockType.RECTANGLE } & MarkRequired<MergeRecord<BaseBlockOptions, RectangleBlockOptions>, 'shadow'>
export type CircleBlock = { type: BlockType.CIRCLE } & MarkRequired<MergeRecord<BaseBlockOptions, CircleBlockOptions>, 'shadow'>
export type LineBlock = { type: BlockType.LINE } & MarkRequired<MergeRecord<BaseBlockOptions, LineBlockOptions>, 'shadow'>
export type GroupBlock = { type: BlockType.GROUP } & MarkRequired<MergeRecord<BaseBlockOptions, GroupBlockOptions>, 'shadow'>

export type Block =
  | GroupBlock
  | TextBlock
  | RectangleBlock
  | CircleBlock
  | LineBlock

const createGroupBlock = ({
  fixed = Fixed.UNSET,
  z = 0,
  opacity = 1,
  angle = 0,
  strokeWidth = 1,
  strokeColor = 'transparent',
  fillColor = 'transparent',
  shadow,
  children,
  ...otherOptions
}: BaseBlockOptions & GroupBlockOptions): GroupBlock => {
  return {
    ...otherOptions,
    type: BlockType.GROUP,
    fixed,
    z,
    opacity,
    angle,
    strokeWidth,
    strokeColor,
    fillColor,
    shadow,
    children
  }
}

const createTextBlock = ({
  textAlign = DEFAULT_STYLE.textAlign,
  textBaseLine = DEFAULT_STYLE.textBaseLine,
  fontSize = DEFAULT_STYLE.fontSize,
  fontWeight = DEFAULT_STYLE.fontWeight,
  fontStyle = DEFAULT_STYLE.fontStyle,
  fontFamily = DEFAULT_STYLE.fontFamily,
  lineHeight = DEFAULT_STYLE.lineHeight,
  fixed = Fixed.UNSET,
  z = 0,
  opacity = 1,
  angle = 0,
  strokeWidth = 1,
  strokeColor = 'transparent',
  fillColor = 'transparent',
  shadow,
  ...otherOptions
}: BaseBlockOptions & TextBlockOptions): TextBlock => {
  return {
    ...otherOptions,
    type: BlockType.TEXT,
    textAlign,
    textBaseLine,
    fontSize,
    fontWeight,
    fontStyle,
    fontFamily,
    lineHeight,
    fixed,
    z,
    opacity,
    angle,
    strokeWidth,
    strokeColor,
    fillColor,
    shadow
  }
}

const createRectangleBlock = ({
  radii = 0,
  fixed = Fixed.UNSET,
  z = 0,
  opacity = 1,
  angle = 0,
  strokeWidth = 1,
  strokeColor = 'transparent',
  fillColor = 'transparent',
  shadow,
  ...options
}: BaseBlockOptions & RectangleBlockOptions): RectangleBlock => {
  return {
    ...options,
    type: BlockType.RECTANGLE,
    radii,
    fixed,
    z,
    opacity,
    angle,
    strokeWidth,
    strokeColor,
    fillColor,
    shadow
  }
}

const createCircleBlock = ({
  fixed = Fixed.UNSET,
  z = 0,
  opacity = 1,
  angle = 0,
  strokeWidth = 1,
  strokeColor = 'transparent',
  fillColor = 'transparent',
  shadow,
  ...options
}: BaseBlockOptions & CircleBlockOptions): CircleBlock => {
  return {
    ...options,
    type: BlockType.CIRCLE,
    fixed,
    z,
    opacity,
    angle,
    strokeWidth,
    strokeColor,
    fillColor,
    shadow
  }
}

const createLineBlock = ({
  lineCap = 'butt',
  lineDashOffset = 0,
  lineJoin = 'miter',
  lineWidth = 1,
  fixed = Fixed.UNSET,
  z = 0,
  opacity = 1,
  angle = 0,
  strokeWidth = 1,
  strokeColor = 'transparent',
  fillColor = 'transparent',
  shadow,
  ...options
}: BaseBlockOptions & LineBlockOptions): LineBlock => {
  return {
    ...options,
    type: BlockType.LINE,
    lineCap,
    lineDashOffset,
    lineJoin,
    lineWidth,
    fixed,
    z,
    opacity,
    angle,
    strokeWidth,
    strokeColor,
    fillColor,
    shadow
  }
}

function createBlock (type: BlockType.GROUP, options: BaseBlockOptions & GroupBlockOptions): GroupBlock
function createBlock (type: BlockType.TEXT, options: BaseBlockOptions & TextBlockOptions): TextBlock
function createBlock (type: BlockType.RECTANGLE, options: BaseBlockOptions & RectangleBlockOptions): RectangleBlock
function createBlock (type: BlockType.CIRCLE, options: BaseBlockOptions & CircleBlockOptions): CircleBlock
function createBlock (type: BlockType.LINE, options: BaseBlockOptions & LineBlockOptions): LineBlock
function createBlock (type: BlockType, options: unknown): Block {
  switch (type) {
    case BlockType.GROUP:
      return createGroupBlock(options as BaseBlockOptions & GroupBlockOptions)
    case BlockType.TEXT:
      return createTextBlock(options as BaseBlockOptions & TextBlockOptions)
    case BlockType.RECTANGLE:
      return createRectangleBlock(options as BaseBlockOptions & RectangleBlockOptions)
    case BlockType.CIRCLE:
      return createCircleBlock(options as BaseBlockOptions & CircleBlockOptions)
    case BlockType.LINE:
      return createLineBlock(options as BaseBlockOptions & LineBlockOptions)
    default:
      throw new TypeError('Invalid type')
  }
}

export { createBlock }
