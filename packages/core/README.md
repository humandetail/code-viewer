# Code Viewer

<p style="display: flex; justify-content: center;">
  <svg width="108" height="108" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="code-viewer-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="5%" stop-color="#FFC988" /><stop offset="95%" stop-color="#FFAC81" /></linearGradient></defs><line x1="384" y1="324" x2="256" y2="192" stroke-width="48" stroke-linecap="round" stroke="#FFC988" /><line x1="640" y1="324" x2="768" y2="192" stroke-width="48" stroke-linecap="round" stroke="#FFAC81" /><rect x="128" y="324" width="768" height="512" rx="64" fill="none" stroke-width="48" stroke="url('#code-viewer-gradient')" /><g stroke="#FFAC81"><g><line x1="256" y1="580" x2="384" y2="580" stroke-width="48" stroke-linecap="round" transform="rotate(-30,256,580)" /></g><g><line x1="256" y1="580" x2="384" y2="580" stroke-width="48" stroke-linecap="round" transform="rotate(30,256,580)" /></g></g><g stroke="#FFC988" transform="rotate(180,512,580)"><g><line x1="256" y1="580" x2="384" y2="580" stroke-width="48" stroke-linecap="round" transform="rotate(-30,256,580)" /></g><g><line x1="256" y1="580" x2="384" y2="580" stroke-width="48" stroke-linecap="round" transform="rotate(30,256,580)" /></g></g><rect x="488" y="384" width="48" height="384" rx="24" fill="url('#code-viewer-gradient')" transform="rotate(36,488,580)" /></svg>
</p>

<p style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px;">
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

This is a library that utilizes Canvas to showcase code snippets, allowing you to visually display your code on web pages in an engaging way.

English | [简体中文](https://github.com/humandetail/code-viewer/blob/main/README-zh_CN.md)

## Features

- Utilizes Canvas technology to draw code snippets, supporting custom styles and colors.

- Supports syntax highlighting for improved code readability.

- Can be embedded into your web page using a simple API.

## Playground

Here's a [playground](https://humandetail.github.io/code-viewer/).

## Installation

```bash
# add code-viewer
npm i @humandetail/code-viewer

# add highlight.js
npm i highlight.js
```

## Usage

```js
import { CodeViewer } from '@humandetail/code-viewer'

const cv = new CodeViewer({
  content: 'Your code string.',
  language: 'language'
})

cv.mount(document.querySelector('#container'))
  .render()
```

## Options

`new CodeViewer(options?: ViewerOptions, theme?: CodeViewerTheme)`

### ViewerOptions

|Property|Description|Type|Default|
|-|-|-|-|
|content|The code string|string|''|
|language|Language of the code|string|'PlainText'|
|width|-|number|0|
|height|-|number|0|
|themeMode|Theme of the code viewer|'light' \| 'dark'|'light'|
|displayLineNumber|Whether the line number is display|boolean|false|
|breakRow|Whether break the row if overflow|boolean|false|
|overflowX|If overflowX is `auto` and breakRow is false. The canvas width will follow the maximum width of the row. If overflowX is `scroll` and breakRow is false. A horizontal scroll bar will be displayed.|'auto' \| 'scroll' \| 'hidden'|'auto'|
|overflowY|-|'auto' \| 'scroll' \| 'hidden'|'auto'|
|headerBarSetting|-|{ visible?: boolean, displayLanguage?: boolean, collapsible?: boolean, copyable?: boolean }|visible: false, displayLanguage: false, collapsible: false, copyable: false|
|isCollapsed|-|boolean|false|

### CodeViewerTheme

If you want to customize the theme, check out the [type declaration file](https://github.com/humandetail/code-viewer/blob/main/packages/core/src/themes/index.ts).

## API

- `setTheme(theme: CodeViewerTheme, themeMode?: 'light' | 'dark'): CodeViewer`

- `update(content?: string, language?: string, resetScroll?: boolean): void`

- `render(): CodeViewer`

- `resize(width: number, height: number): void`

- `mount(el: string | Element): CodeViewer`

- `unmount(): void`

## Contributing

If you encounter any [issues](https://github.com/humandetail/code-viewer/issues) or wish to improve this library, feel free to submit issues and pull requests. Your contributions will be greatly appreciated!

## LICENSE

This project is licensed under the [MIT License](https://github.com/humandetail/code-viewer/blob/main/LICENSE).
