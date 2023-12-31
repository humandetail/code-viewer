import type { Color, FontStyle, TextAlign, TextBaseLine, TupleToRecord } from '../types'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'

export interface Style {
  color?: Color
  backgroundColor?: Color
  fontSize?: number
  lineHeight?: number
  fontWeight?: number | string
  fontStyle?: FontStyle
  fontFamily?: string
  textAlign?: TextAlign
  textBaseLine?: TextBaseLine
  opacity?: number

  /** all */
  borderStyle?: BorderStyle
  /** all */
  borderWidth?: number
  /** all */
  borderColor?: Color

  borderRadius?: number | DOMPointInit | Iterable<number | DOMPointInit>

  /** [top, right, bottom, left] */
  padding?: [number, number, number, number]
  // /** [top, right, bottom, left] */
  // margin?: [number, number, number, number]
}

export interface LineNumberStyle {
  color?: Color
  borderColor?: Color
  backgroundColor?: Color
  padding?: number
}

export type ScopeStyles = TupleToRecord<typeof scopes, Style>

export interface ScrollBarStyle {
  size: number
  borderColor: Color
  backgroundColor: Color
  thumbBackgroundColor: Color
}

export type ColorStop = [number, string]

interface Button {
  size: number
  fillColor?: Color
  strokeColor?: Color
}

export interface HeaderBarStyle {
  borderColor?: Color
  backgroundColor?: Color
  padding?: [number, number, number, number]
  language?: {
    color?: Color
    fontSize?: number
  }
  copyButton?: Button
  collapseButton?: Button
}

/**
 * Stylable Scopes
 * @see https://highlightjs.readthedocs.io/en/latest/css-classes-reference.html#scope-reference
 */
const scopes = [
  'keyword',
  'built_in',
  'type',
  'literal',
  'number',
  'operator',
  'punctuation',
  'property',
  'regexp',
  'string',
  'char.escape',
  'subst',
  'symbol',
  'class',
  'function',
  'variable',
  'variable.language',
  'variable.constant',
  'title',
  'title.class',
  'title.class.inherited',
  'title.function',
  'title.function.invoke',
  'params',
  'comment',
  'doctag',
  'meta',
  'meta.prompt',
  'meta keyword',
  'meta string',
  'section',
  'tag',
  'name',
  'attr',
  'attribute',
  'bullet',
  'code',
  'emphasis',
  'strong',
  'formula',
  'link',
  'quote',
  'selector-tag',
  'selector-id',
  'selector-class',
  'selector-attr',
  'selector-pseudo',
  'template-tag',
  'template-variable',
  'addition',
  'deletion'
] as const

export const BTN_COLLAPSE_ID = 'BTN_COLLAPSE'
export const BTN_COPY_ID = 'BTN_COPY'

export const DEFAULT_FONT_SIZE = 16
export const DEFAULT_LINE_HEIGHT = 22
export const DEFAULT_PADDING = 16
export const DEFAULT_BORDER_RADIUS = 4

/** Default Style */
export const DEFAULT_STYLE: Required<Style> = {
  color: '#24292e',
  backgroundColor: '#f6f6f6',
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontFamily: 'monospace, Courier New, Menlo, Monaco',
  textAlign: 'left',
  textBaseLine: 'middle',
  opacity: 1,
  borderWidth: 1,
  borderColor: '#333',
  borderStyle: 'solid',
  borderRadius: DEFAULT_BORDER_RADIUS,
  padding: [DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING]
}

/** Default Scope Styles */
// export const DEFAULT_SCOPE_STYLES = ((): ScopeStyles =>
//   ({})
// )()

// export const DEFAULT_SELECT_STYLE: Style = {
//   backgroundColor: '#0088ff'
// }

export const DEFAULT_LINE_NUMBER_STYLE: Required<LineNumberStyle> = {
  color: '#a1a1a1',
  borderColor: '#c1c1c1',
  backgroundColor: '#f6f6f6',
  padding: DEFAULT_PADDING
}

export const DEFAULT_SCROLL_BAR_STYLE: Required<ScrollBarStyle> = {
  size: 10,
  borderColor: '#e1e1e1',
  backgroundColor: 'rgba(225,225,225,.1)',
  thumbBackgroundColor: 'pink'
}

export const DEFAULT_HEADER_BAR_STYLE: Required<HeaderBarStyle> = {
  borderColor: '#c1c1c1',
  backgroundColor: '#f6f6f6',
  padding: [DEFAULT_PADDING / 2, DEFAULT_PADDING, DEFAULT_PADDING / 2, DEFAULT_PADDING],
  language: {
    color: '#a1a1a1',
    fontSize: 14
  },
  copyButton: {
    size: 18,
    fillColor: 'transparent',
    strokeColor: '#a1a1a1'
  },
  collapseButton: {
    size: 18,
    fillColor: '#a1a1a1',
    strokeColor: 'transparent'
  }
}
