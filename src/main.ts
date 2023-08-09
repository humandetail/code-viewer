import './style.css'

import hljs from 'highlight.js'
import 'highlight.js/styles/default.css'

import CodeViewer from './libs/CodeViewer'
import githubThemes from './theme/github'

// const code = '# cd /var/share\n/mysql\n\n\n# cd /var/share/mysql\n\nnpm install xxx\n# s\\nb\nnpm run dev'
// const language = 'shell'

const code = '/**\n * @param a - 这里是参数 a\n */\nfunction test (a) {\n  const b = [\n    1,\n    2\n  ];\n  return a + b;\n}\n\ntest(1);'
const language = 'js'

const a = hljs.highlight(code, {
  language
})

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<pre style="width: 160px; text-align: left; white-space: break-spaces">${a.value}</pre>`


const cv = new CodeViewer({
  content: code,
  language,
  style: {
    fontSize: 12,
    lineHeight: 18
  },
  width: 200,
  height: 300
})

cv.mount(document.querySelector<HTMLDivElement>('#app')!)

cv.setThemes(githubThemes)

cv.render()
