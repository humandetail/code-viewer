import type { LineNumberStyle, ScopeStyles, Style } from '../config/defaultSetting'
import lightTheme from './github'
import darkTheme from './githubDark'

export interface CodeViewerTheme {
  style?: Style
  lineNumberStyle?: LineNumberStyle
  scrollBarStyle?: Style
  scopeStyles?: ScopeStyles
}

export {
  lightTheme,
  darkTheme
}
