import hljs from 'highlight.js'
import { type HeaderBar, type LineNumberStyle, type Style, type ThemeOptions } from '../config/defaultSetting'
import { type Size, getMaxRenderIndex, getTextSize } from './Measure'
import { LF_REGEX, compose, isString, splitLF, toCurry } from '../utils/tools'
import type CodeViewer from './CodeViewer'

export interface ScopeData {
  scope: string
  children: Array<string | ScopeData>
}

interface FlatData {
  content: string
  scope?: string
}

export interface InlineItem {
  content: string
  style: Required<Style>
  size: Size
  left: number
  top: number
  scope?: string
}

export interface LineNumber {
  display: boolean
  value: number
  width: number
  height: number
  left: number
  top: number
}

export interface Row extends Size {
  lineNumber: LineNumber
  children: InlineItem[]
  top: number
}

const flatScopeDataList = (
  scopeDataList: Array<string | ScopeData>,
  scope?: string
): FlatData[] => {
  return scopeDataList.reduce((prev: FlatData[], item) => {
    return prev.concat(
      isString(item)
        ? { content: item, scope }
        : flatScopeDataList(item.children, item.scope)
    )
  }, [])
}

const parseRow = (
  breakRow: boolean,
  displayLineNumber: boolean,
  lineNumberStyle: Required<LineNumberStyle>,
  maxWidth: number,
  lineHeight: number,
  headerBar: HeaderBar,
  rows: Row[]
): Row[] => {
  if (rows.length === 0) return rows

  let left = 0
  let top = headerBar.visible
    ? headerBar.style.padding[0] + headerBar.style.padding[3] + lineHeight
    : 0

  const maxNumber = Math.max.apply(null, rows.map(({ lineNumber }) => lineNumber.value))
  const { width } = getTextSize(`${maxNumber}`, { ...rows[0].children[0].style })
  const lineNumberWidth = (
    // padding-left
    (lineNumberStyle.padding ?? 0) +
    // max line number width
    width +
    // padding-right
    (lineNumberStyle.padding ?? 0)
  )

  return rows.map(row => {
    row.top = top
    row.height = lineHeight

    left += displayLineNumber ? lineNumberWidth : 0

    const children = [...row.children]
    let item: InlineItem
    let itemTop = 0

    for (let i = 0; i < children.length; i++) {
      item = children[i]

      const { content, style, size: { width } } = item
      const remainingWidth = maxWidth - (left + width)

      if (breakRow && remainingWidth < 0) {
        // If the next render is going to be out of range,
        // first render part of the content that is sufficient to render,
        // and then move the rest to the next item.

        const idx = getMaxRenderIndex(content, style, remainingWidth + width)

        const newContent = content.slice(0, idx)
        const nextContent = content.slice(idx)

        children.splice(i, 1, {
          ...item,
          left,
          top: itemTop,
          content: newContent
        }, {
          ...item,
          left,
          top: itemTop + lineHeight,
          content: nextContent
        })

        // reset left
        left = displayLineNumber ? lineNumberWidth : 0
        top += lineHeight
        itemTop += lineHeight
        row.height += lineHeight
      } else {
        item.left = left
        item.top = itemTop

        // set left
        left += width
      }
    }
    left = 0
    top += lineHeight

    const childrenWidth = children.reduce((acc, { size: { width } }) => acc + width, 0)
    const rowLineNumberWidth = lineNumberWidth
    return {
      ...row,
      lineNumber: {
        ...row.lineNumber,
        display: displayLineNumber,
        width: rowLineNumberWidth,
        height: row.height,
        top: row.top,
        left: 0
      },
      width: breakRow
        ? Math.min(maxWidth, childrenWidth + (displayLineNumber ? rowLineNumberWidth : 0))
        : childrenWidth + (displayLineNumber ? rowLineNumberWidth : 0),
      children
    }
  })
}

const mergeData = (
  getScopeStyle: CodeViewer['getScopeStyle'],
  list: FlatData[]
) => {
  let lineNumber = 1
  let children: InlineItem[] = []

  const rows: Row[] = []

  const pushRow = (children: InlineItem[]) => {
    rows.push({
      top: 0,
      width: 0,
      height: 0,
      lineNumber: {
        display: false,
        value: lineNumber++,
        width: 0,
        height: 0,
        left: 0,
        top: 0
      },
      children
    })
  }

  list.forEach(({ scope, content }) => {
    const currentStyle = getScopeStyle(scope as keyof ThemeOptions)

    if (LF_REGEX.test(content)) {
      splitLF(content).forEach((item, index, sourceArr) => {
        children.push({
          scope,
          content: item,
          style: currentStyle,
          size: getTextSize(item, currentStyle),
          left: 0,
          top: 0
        })

        if (sourceArr[index + 1] !== undefined) {
          pushRow(children)

          children = []
        }
      })
    } else {
      children.push({
        scope,
        content,
        style: currentStyle,
        size: getTextSize(content, currentStyle),
        left: 0,
        top: 0
      })
    }
  })

  if (children.length !== 0) {
    pushRow(children)
  }

  return rows
}

/**
 * Parse content
 * @param content - code string
 * @param language - code language
 * @param breakRow - whether to break the line
 * @param displayLineNumber - whether to display the line number
 * @param lineNumberStyle - line number style
 * @param maxWidth - max render width
 * @param lineHeight - line height
 * @param headerBar - header bar setting
 * @param getScopeStyle - get scope style
 */
export const parseContent = (
  content: string,
  language = 'PlainText',
  breakRow: boolean,
  displayLineNumber: boolean,
  lineNumberStyle: Required<LineNumberStyle>,
  maxWidth: number,
  lineHeight: number,
  headerBar: HeaderBar,
  getScopeStyle: CodeViewer['getScopeStyle']
) => {
  const scopeDataList = (
    hljs.highlight(
      content, { language }
    ) as any
  )._emitter.rootNode.children as ScopeData[]

  return compose<any>(
    toCurry<any>(parseRow)(breakRow)(displayLineNumber)(lineNumberStyle)(maxWidth)(lineHeight)(headerBar),
    toCurry<any>(mergeData)(getScopeStyle),
    flatScopeDataList
  )(scopeDataList)
}
