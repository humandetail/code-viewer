# Code Viewer

这是一个使用 Canvas 来展示代码的库，它允许您在网页上绘制代码片段，以更具视觉吸引力的方式展示您的代码。

[English](https://github.com/humandetail/code-viewer/README.md) | 简体中文

## 特性

- 使用 Canvas 技术绘制代码，支持自定义样式和颜色。

- 支持语法高亮，使代码更易于阅读。

- 可以通过简单的 API 将代码片段嵌入到您的网页中。

## 演示

这是一个 [playground](https://humandetail.github.io/code-viewer/).

## 安装

```bash
# 安装 code-viewer
npm i @humandetail/code-viewer

# 安装 highlight.js
npm i highlight.js
```

## 使用示例

```js
import { CodeViewer, githubThemes } from '@humandetail/code-viewer'

const cv = new CodeViewer({
  content: 'Your code string.',
  language: 'language'
})

cv.setThemes(githubThemes)
  .mount(document.querySelector('#container'))
  .render()
```

## 选项

...

## API

...

## 参与贡献

如果您发现任何[问题](https://github.com/humandetail/code-viewer/issues)或想要改进这个库，欢迎提交问题和拉取请求。您的贡献将不胜感激！

## 许可证

本项目采用 [MIT 许可证](https://github.com/humandetail/code-viewer/blob/%40humandetail/code-viewer-0.1.0/LICENSE).
