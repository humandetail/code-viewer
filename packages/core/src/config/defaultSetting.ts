import type { Color, TupleToRecord } from '../types'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'

export interface Style {
  color?: Color
  backgroundColor?: Color
  fontSize?: number
  lineHeight?: number
  fontWeight?: number | string
  fontStyle?: string
  fontFamily?: string
  opacity?: number

  /** all | [top, right, bottom, left] */
  borderStyle?: BorderStyle | [BorderStyle, BorderStyle, BorderStyle, BorderStyle]
  /** all | [top, right, bottom, left] */
  borderWidth?: number | [number, number, number, number]
  /** all | [top, right, bottom, left] */
  borderColor?: Color | [Color, Color, Color, Color]

  borderRadius?: number

  /** [top, right, bottom, left] */
  padding?: [number, number, number, number]
  /** [top, right, bottom, left] */
  margin?: [number, number, number, number]
}

export interface LineNumberStyle {
  color?: Color
  borderColor?: Color
  borderFocusColor?: Color
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

export interface HeaderBar {
  visible: boolean
  collapsible?: boolean
  canCopy?: boolean
  language?: {
    visible: boolean
    fontSize: number
    color: Color
  }
  style: {
    borderColor: Color
    backgroundColor: Color
    padding: [number, number, number, number]
  }
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

export const DEFAULT_FONT_SIZE = 16
export const DEFAULT_LINE_HEIGHT = 22
export const DEFAULT_PADDING = 16
export const DEFAULT_BORDER_RADIUS = 8

/** Default Style */
export const DEFAULT_STYLE: Required<Style> = {
  color: '#24292e',
  backgroundColor: '#f6f6f6',
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontFamily: 'monospace, Courier New, Menlo, Monaco',
  opacity: 1,
  borderWidth: 1,
  borderColor: '#333',
  borderStyle: 'solid',
  borderRadius: 0,
  padding: [DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING],
  margin: [0, 0, 0, 0]

  // @todo
  // hoverStyle
  // ...
}

/** Default Scope Styles */
export const DEFAULT_SCOPE_STYLES = ((): ScopeStyles =>
  // scopes.reduce((options, scope) => {
  //   options[scope] = DEFAULT_STYLE
  //   return options
  // }, {} as Required<ScopeStyles>)
  ({})
)()

export const DEFAULT_SELECT_STYLE: Style = {
  backgroundColor: '#0088ff'
}

export const DEFAULT_LINE_NUMBER_STYLE: Required<LineNumberStyle> = {
  color: '#a1a1a1',
  borderColor: '#c1c1c1',
  borderFocusColor: '#c1c1c1',
  padding: DEFAULT_PADDING
}

export const DEFAULT_SCROLL_BAR_STYLE: Required<ScrollBarStyle> = {
  size: 10,
  borderColor: '#e1e1e1',
  backgroundColor: 'rgba(225,225,225,.1)',
  thumbBackgroundColor: 'pink'
}

export const DEFAULT_HEADER_BAR: HeaderBar = {
  visible: true,
  collapsible: true,
  canCopy: true,
  language: {
    visible: true,
    color: '#9d9e9f',
    fontSize: 14
  },
  style: {
    padding: [DEFAULT_PADDING / 2, DEFAULT_PADDING, DEFAULT_PADDING / 2, DEFAULT_PADDING],
    borderColor: '#c1c1c1',
    backgroundColor: '#f6f6f6'
  }
}
