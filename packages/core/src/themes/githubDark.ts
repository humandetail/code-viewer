import type { CodeViewerTheme } from '.'
import { DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SCROLL_BAR_STYLE, DEFAULT_STYLE, type ScopeStyles } from '../config/defaultSetting'

// .hljs{color:#c9d1d9;background:#0d1117}

const scopeStyles: ScopeStyles = {
  doctag: { color: '#ff7b72' },
  keyword: { color: '#ff7b72' },
  'meta keyword': { color: '#ff7b72' },
  'template-tag': { color: '#ff7b72' },
  'template-variable': { color: '#ff7b72' },
  type: { color: '#ff7b72' },
  'variable.language': { color: '#ff7b72' },
  title: { color: '#d2a8ff' },
  'title.class': { color: '#d2a8ff' },
  'title.class.inherited': { color: '#d2a8ff' },
  'title.function': { color: '#d2a8ff' },
  attr: { color: '#79c0ff' },
  attribute: { color: '#79c0ff' },
  literal: { color: '#79c0ff' },
  meta: { color: '#79c0ff' },
  number: { color: '#79c0ff' },
  operator: { color: '#79c0ff' },
  'selector-attr': { color: '#79c0ff' },
  'selector-class': { color: '#79c0ff' },
  'selector-id': { color: '#79c0ff' },
  variable: { color: '#79c0ff' },
  'meta string': { color: '#a5d6ff' },
  regexp: { color: '#a5d6ff' },
  string: { color: '#a5d6ff' },
  built_in: { color: '#ffa657' },
  symbol: { color: '#ffa657' },
  code: { color: '#8b949e' },
  comment: { color: '#8b949e' },
  formula: { color: '#8b949e' },
  name: { color: '#7ee787' },
  quote: { color: '#7ee787' },
  'selector-pseudo': { color: '#7ee787' },
  'selector-tag': { color: '#7ee787' },
  subst: { color: '#c9d1d9' },
  section: { color: '#1f6feb', fontWeight: 700 },
  bullet: { color: '#f2cc60' },
  emphasis: { color: '#c9d1d9', fontStyle: 'italic' },
  strong: { color: '#c9d1d9', fontWeight: 700 },
  addition: { color: '#aff5b4', backgroundColor: '#033a16' },
  deletion: { color: '#ffdcd7', backgroundColor: '#67060c' }
}

const darkTheme: Required<CodeViewerTheme> = {
  style: {
    ...DEFAULT_STYLE,
    color: '#c9d1d9',
    backgroundColor: '#0d1117',
    borderColor: '#f1f1f1'
  },
  lineNumberStyle: {
    ...DEFAULT_LINE_NUMBER_STYLE,
    color: '#a1a1a1',
    borderColor: '#c1c1c1',
    borderFocusColor: '#c1c1c1'
  },
  scrollBarStyle: {
    ...DEFAULT_SCROLL_BAR_STYLE
  },
  scopeStyles
}

export default darkTheme
