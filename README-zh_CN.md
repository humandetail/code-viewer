# Code Viewer

<center>
  <img src="https://humandetail.github.io/code-viewer/code-viewer.svg" width="108" height="108" />
</center>

<center>
  <a href="https://www.npmjs.com/package/@humandetail/code-viewer">
    <img src="https://img.shields.io/npm/v/@humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/actions/workflows/ci.yaml">
    <img src="https://github.com/humandetail/code-viewer/actions/workflows/ci.yaml/badge.svg?branch=main" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/issues">
    <img src="https://img.shields.io/github/issues/humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer">
    <img src="https://img.shields.io/github/stars/humandetail/code-viewer.svg" />
  </a>
</center>
  <a href="https://www.npmjs.com/package/@humandetail/code-viewer">
    <img src="https://img.shields.io/npm/v/@humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/actions/workflows/ci.yaml">
    <img src="https://github.com/humandetail/code-viewer/actions/workflows/ci.yaml/badge.svg?branch=main" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer/issues">
    <img src="https://img.shields.io/github/issues/humandetail/code-viewer.svg" />
  </a>
  <a href="https://github.com/humandetail/code-viewer">
    <img src="https://img.shields.io/github/stars/humandetail/code-viewer.svg" />
  </a>
</p>

这是一个使用 Canvas 来展示代码的库，它允许您在网页上绘制代码片段，以更具视觉吸引力的方式展示您的代码。

[English](https://github.com/humandetail/code-viewer/blob/main/README.md) | 简体中文

## 特性

- 使用 Canvas 技术绘制代码，支持自定义样式和颜色。

- 支持语法高亮，使代码更易于阅读。

- 可以通过简单的 API 将代码片段嵌入到您的网页中。

## 演示

这是一个 [演示地址](https://humandetail.github.io/code-viewer/).

## 安装

```bash
# 安装 code-viewer
npm i @humandetail/code-viewer

# 安装 highlight.js
npm i highlight.js
```

## 使用示例

```js
import { CodeViewer } from '@humandetail/code-viewer'

const cv = new CodeViewer({
  content: 'Your code string.',
  language: 'language'
})

cv.mount(document.querySelector('#container'))
  .render()
```

## 选项

`new CodeViewer(options?: ViewerOptions, theme?: CodeViewerTheme)`

### ViewerOptions

|属性|说明|类型|默认值|
|-|-|-|-|
|content|代码字符串|string|''|
|language|代码的语言|string|'PlainText'|
|width|-|number|0|
|height|-|number|0|
|themeMode|主题|'light' \| 'dark'|'light'|
|displayLineNumber|是否显示行号|boolean|false|
|breakRow|是否在行溢出时打断该打|boolean|false|
|overflowX|如果 overflowX 设置为 `auto` 并且 breakRow 是 false，那么整个canvas的宽度会自适应；如果 overflowX 设置为 `scroll` 并且 breakRow 是 false，那么可以横行滚动|'auto' \| 'scroll' \| 'hidden'|'auto'|
|overflowY|-|'auto' \| 'scroll' \| 'hidden'|'auto'|
|headerBarSetting|头部区域设置|{ visible?: boolean, displayLanguage?: boolean, collapsible?: boolean, copyable?: boolean }|visible: false, displayLanguage: false, collapsible: false, copyable: false|
|isCollapsed|-|boolean|false|

### CodeViewerTheme

如果你想要自定义主题，请查看[类型声明文件](https://github.com/humandetail/code-viewer/blob/main/packages/core/src/themes/index.ts).

## API

- `setTheme(theme: CodeViewerTheme, themeMode?: 'light' | 'dark'): CodeViewer`

- `update(content?: string, language?: string, resetScroll?: boolean): void`

- `render(): CodeViewer`

- `resize(width: number, height: number): void`

- `mount(el: string | Element): CodeViewer`

- `unmount(): void`

## 参与贡献

如果您发现任何[问题](https://github.com/humandetail/code-viewer/issues)或想要改进这个库，欢迎提交问题和拉取请求。您的贡献将不胜感激！

## 许可证

本项目采用 [MIT 许可证](https://github.com/humandetail/code-viewer/blob/main/LICENSE).
