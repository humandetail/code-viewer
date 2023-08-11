import './style.css'

import hljs from 'highlight.js'
import 'highlight.js/styles/default.css'

import CodeViewer from './libs/CodeViewer'
import githubThemes from './theme/github'

const code = '<!-- <div>Hello world</div> -->\n<div id="wrapper" class="wrapper">\n  Hello world\n</div>\n<script type="text/javascript">\n  const oDiv = querySelector(\'#wrapper\');\n  console.log(oDiv.textContent); // Hello world\n</script>'
const language = 'xml'

// const code = '/**\n * @param a - 这里是参数 a\n */\nfunction test (a) {\n  const b = [\n    1,\n    2\n  ];\n  return a + b;\n}\n\ntest(1);'
// const language = 'js'

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
  height: 200,
  breakRow: false,
  overflowX: 'scroll',
  overflowY: 'auto'
})

cv.mount(document.querySelector<HTMLDivElement>('#app')!)

cv.setThemes(githubThemes)

cv.render()
