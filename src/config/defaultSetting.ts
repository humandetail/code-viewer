import { type TupleToRecord } from '../types'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'

export interface Style {
  color?: string
  backgroundColor?: string
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
  borderColor?: string | [string, string, string, string]

  borderRadius?: number

  /** [top, right, bottom, left] */
  padding?: [number, number, number, number]
  /** [top, right, bottom, left] */
  margin?: [number, number, number, number]
}

export interface CursorStyle {
  backgroundColor: string
  width: number
  height?: number
}

export type ThemeOptions = TupleToRecord<typeof scopes, Style>

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

/** Default Theme Options */
export const DEFAULT_THEME_OPTIONS = ((): ThemeOptions =>
  // scopes.reduce((options, scope) => {
  //   options[scope] = DEFAULT_STYLE
  //   return options
  // }, {} as Required<ThemeOptions>)
  ({})
)()

export const DEFAULT_CURSOR_STYLE: CursorStyle = {
  backgroundColor: '#333',
  width: 1
}

export const DEFAULT_SELECT_STYLE: Style = {
  backgroundColor: '#0088ff'
}

export const DEFAULT_LINE_NUMBER_STYLE: Required<Style> = {
  ...DEFAULT_STYLE,
  color: '#a1a1a1',
  fontSize: DEFAULT_FONT_SIZE - 2,
  lineHeight: DEFAULT_LINE_HEIGHT,
  borderWidth: [0, 1, 0, 0],
  borderColor: '#c1c1c1',
  borderStyle: 'solid',
  borderRadius: 0,
  padding: [0, DEFAULT_PADDING / 2, 0, DEFAULT_PADDING / 2],
  margin: [0, DEFAULT_PADDING, 0, 0]
}
