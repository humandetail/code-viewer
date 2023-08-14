import type { LineNumberStyle, ScopeStyles, Style } from '../config/defaultSetting'
import defaultTheme from './github'

export interface CodeViewerTheme {
  style?: Style
  lineNumberStyle?: LineNumberStyle
  scrollBarStyle?: Style
  scopeStyles?: ScopeStyles
}

export {
  defaultTheme
}
