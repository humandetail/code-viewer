import CodeViewer, { type ViewerOptions } from './src/libs/CodeViewer'
import { type CodeViewerTheme } from './src/themes'
import hljs from 'highlight.js'
import pkg from './package.json'

const _version_ = (pkg as any).version
const listLanguages = hljs.listLanguages

export {
  CodeViewer,
  listLanguages,
  type ViewerOptions,
  type CodeViewerTheme,
  _version_
}
