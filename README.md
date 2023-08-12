# Code Viewer

This is a library that utilizes Canvas to showcase code snippets, allowing you to visually display your code on web pages in an engaging way.

English | [简体中文](https://github.com/humandetail/code-viewer/README-zh_CN.md)

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
import { CodeViewer, githubThemes } from '@humandetail/code-viewer'

const cv = new CodeViewer({
  content: 'Your code string.',
  language: 'language'
})

cv.setThemes(githubThemes)
  .mount(document.querySelector('#container'))
  .render()
```

## Options

...

## API

...

## Contributing

If you encounter any [issues](https://github.com/humandetail/code-viewer/issues) or wish to improve this library, feel free to submit issues and pull requests. Your contributions will be greatly appreciated!

## LICENSE

This project is licensed under the [MIT License](https://github.com/humandetail/code-viewer/blob/%40humandetail/code-viewer-0.1.0/LICENSE).
