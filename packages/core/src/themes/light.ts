import type { CodeViewerTheme } from '.'
import { DEFAULT_HEADER_BAR_STYLE, DEFAULT_LINE_NUMBER_STYLE, DEFAULT_SCROLL_BAR_STYLE, DEFAULT_STYLE, type ScopeStyles } from '../config/defaultSetting'

const scopeStyles: ScopeStyles = {
  doctag: { color: '#d73a49' },
  keyword: { color: '#d73a49' },
  'meta keyword': { color: '#d73a49' },
  'template-tag': { color: '#d73a49' },
  'template-variable': { color: '#d73a49' },
  type: { color: '#d73a49' },
  'variable.language': { color: '#d73a49' },
  title: { color: '#6f42c1' },
  'title.class': { color: '#6f42c1' },
  'title.class.inherited': { color: '#6f42c1' },
  'title.function': { color: '#6f42c1' },
  attr: { color: '#005cc5' },
  attribute: { color: '#005cc5' },
  literal: { color: '#005cc5' },
  meta: { color: '#005cc5' },
  number: { color: '#005cc5' },
  operator: { color: '#005cc5' },
  'selector-attr': { color: '#005cc5' },
  'selector-class': { color: '#005cc5' },
  'selector-id': { color: '#005cc5' },
  variable: { color: '#005cc5' },
  'meta string': { color: '#032f62' },
  regexp: { color: '#032f62' },
  string: { color: '#032f62' },
  built_in: { color: '#e36209' },
  symbol: { color: '#e36209 ' },
  code: { color: '#6a737d' },
  comment: { color: '#6a737d' },
  formula: { color: '#6a737d' },
  name: { color: '#22863a' },
  quote: { color: '#22863a' },
  'selector-pseudo': { color: '#22863a' },
  'selector-tag': { color: '#22863a' },
  subst: { color: '#24292e' },
  section: { color: '#005cc5;font-weight:700' },
  bullet: { color: '#735c0f' },
  emphasis: { color: '#24292e', fontStyle: 'italic' },
  strong: { color: '#24292e', fontWeight: 700 },
  addition: { color: '#22863a', backgroundColor: '#f0fff4' },
  deletion: { color: '#b31d28', backgroundColor: '#ffeef0' }
}

const theme: Required<CodeViewerTheme> = {
  style: DEFAULT_STYLE,
  lineNumberStyle: DEFAULT_LINE_NUMBER_STYLE,
  scrollBarStyle: DEFAULT_SCROLL_BAR_STYLE,
  headerBarStyle: DEFAULT_HEADER_BAR_STYLE,
  scopeStyles
}

export default theme
