import CodeViewer from './src/libs/CodeViewer'
import githubThemes from './src/theme/github'
import hljs from 'highlight.js'
import pkg from './package.json'

const _version_ = (pkg as any).version
const listLanguages = hljs.listLanguages

export {
  CodeViewer,
  listLanguages,
  githubThemes,
  _version_
}
