import type { HeaderBarStyle, LineNumberStyle, ScopeStyles, Style } from '../config/defaultSetting'
import lightTheme from './light'
import darkTheme from './dark'

export interface CodeViewerTheme {
  style?: Style
  lineNumberStyle?: LineNumberStyle
  scrollBarStyle?: Style
  scopeStyles?: ScopeStyles
  headerBarStyle?: HeaderBarStyle
}

export {
  lightTheme,
  darkTheme
}
