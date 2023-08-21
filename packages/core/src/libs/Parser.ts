import hljs from 'highlight.js'
import { type Style, type ScopeStyles, DEFAULT_COLLAPSE_BUTTON, DEFAULT_COPY_BUTTON } from '../config/defaultSetting'
import { type Size, getMaxRenderIndex, getTextSize } from './Measure'
import { LF_REGEX, compose, isString, splitLF, toCurry } from '../utils/tools'
import type CodeViewer from './CodeViewer'
import { type Block, BlockType, Fixed, createBlock } from './Block'

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
  codeViewer: CodeViewer,
  rows: Row[]
): Row[] => {
  if (rows.length === 0) return rows

  const {
    breakRow,
    displayLineNumber,
    lineNumberStyle,
    width: w,
    style: {
      lineHeight,
      padding
    },
    headerBar
  } = codeViewer

  const maxWidth = w - (padding[1] ?? 0) - (padding[3] ?? 0)

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
    const currentStyle = getScopeStyle(scope as keyof ScopeStyles)

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

const convertToBlock = (codeViewer: CodeViewer, rows: Row[]) => {
  const {
    style: {
      lineHeight,
      fontSize,
      fontStyle,
      fontWeight,
      padding: [, , , left]
    },
    lineNumberStyle
  } = codeViewer

  const blocks: Block[] = []
  // convert children
  rows.forEach(({ children, lineNumber, top }) => {
    children.forEach(item => {
      const {
        size: {
          width,
          height
        },
        content,
        style: {
          textAlign,
          textBaseLine,
          fontSize,
          fontWeight,
          fontStyle,
          color
        }
      } = item
      blocks.push(createBlock(BlockType.TEXT, {
        x: item.left + left + width / 2,
        y: item.top + top + height / 2,
        width,
        height,
        z: 0,
        angle: 0,
        fixed: Fixed.UNSET,
        opacity: 1,
        shadow: undefined,
        text: content,
        textAlign,
        textBaseLine,
        fontSize,
        fontWeight,
        fontStyle,
        lineHeight,
        fillColor: color,
        strokeColor: 'transparent'
      }))
    })

    // cover line number
    if (lineNumber.display) {
      blocks.push(createBlock(BlockType.GROUP, {
        x: lineNumber.width / 2,
        y: lineNumber.top + lineHeight / 2,
        z: 1,
        angle: 0,
        width: lineNumber.width,
        height: lineNumber.height,
        fixed: Fixed.LEFT,
        opacity: 1,
        shadow: undefined,
        children: [
          createBlock(BlockType.TEXT, {
            x: 0,
            y: 0,
            angle: 0,
            width: lineNumber.width - (lineNumberStyle.padding ?? 0) * 2,
            height: lineNumber.height,
            text: `${lineNumber.value}`,
            textAlign: 'right',
            textBaseLine: 'middle',
            fontSize,
            fontStyle,
            fontWeight,
            lineHeight,
            fillColor: lineNumberStyle.color,
            strokeColor: undefined
          }),
          createBlock(BlockType.LINE, {
            x: lineNumber.width / 2,
            y: 0,
            width: 1,
            height: lineNumber.height,
            points: [{
              x: 0,
              y: -lineNumber.height / 2
            }, {
              x: 0,
              y: lineNumber.height / 2
            }],
            strokeColor: lineNumberStyle.borderColor
          })
        ]
      }))
    }
  })

  return blocks
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
  codeViewer: CodeViewer
) => {
  const scopeDataList = (
    hljs.highlight(
      content, { language }
    ) as any
  )._emitter.rootNode.children as ScopeData[]

  return compose<any>(
    toCurry<any>(convertToBlock)(codeViewer),
    toCurry<any>(parseRow)(codeViewer),
    toCurry<any>(mergeData)(codeViewer.getScopeStyle.bind(codeViewer)),
    flatScopeDataList
  )(scopeDataList)
}

export const parseHeaderBar = (codeViewer: CodeViewer) => {
  const blocks: Block[] = []

  const {
    width,
    headerBar: {
      visible,
      collapsible,
      canCopy,
      language,
      style
    },
    style: {
      lineHeight,
      borderRadius
    }
  } = codeViewer

  const height = (style.padding[0] ?? 0) + lineHeight + (style.padding[2] ?? 0)

  if (visible) {
    // bg
    blocks.push(createBlock(BlockType.RECTANGLE, {
      x: width / 2,
      y: height / 2,
      z: 1,
      width,
      height,
      radii: borderRadius,
      fillColor: style.backgroundColor
    }))

    // btn-collapse
    if (collapsible) {
      const {
        radius,
        width,
        height,
        fillColor,
        strokeColor,
        triangleFillColor
      } = DEFAULT_COLLAPSE_BUTTON

      blocks.push(createBlock(BlockType.GROUP, {
        x: (style.padding.at(-1) ?? 0) + radius,
        y: (style.padding[0] ?? 0) + lineHeight / 2,
        width,
        height,
        z: 2,
        angle: 45,
        children: [
          createBlock(BlockType.CIRCLE, {
            x: 0,
            y: 0,
            width,
            height,
            radius,
            fillColor,
            strokeColor
          }),
          createBlock(BlockType.LINE, {
            x: 0,
            y: -radius / 2,
            width: radius / 2,
            height: radius - 2,
            points: !codeViewer.collapsed
              ? [
                  {
                    x: 0,
                    y: radius / 3
                  },
                  {
                    x: -radius / 2,
                    y: -1
                  },
                  {
                    x: radius / 2,
                    y: -1
                  },
                  {
                    x: 0,
                    y: radius / 3
                  }
                ]
              : [
                  {
                    x: 0,
                    y: -1
                  },
                  {
                    x: -radius / 2,
                    y: radius / 3
                  },
                  {
                    x: radius / 2,
                    y: radius / 3
                  },
                  {
                    x: 0,
                    y: -1
                  }
                ],
            fillColor: triangleFillColor
          }),
          createBlock(BlockType.LINE, {
            x: 0,
            y: radius / 2,
            width: radius / 2,
            height: radius - 2,
            points: !codeViewer.collapsed
              ? [
                  {
                    x: 0,
                    y: -radius / 3
                  },
                  {
                    x: -radius / 2,
                    y: 1
                  },
                  {
                    x: radius / 2,
                    y: 1
                  },
                  {
                    x: 0,
                    y: -radius / 3
                  }
                ]
              : [
                  {
                    x: 0,
                    y: 1
                  },
                  {
                    x: -radius / 2,
                    y: -radius / 3
                  },
                  {
                    x: radius / 2,
                    y: -radius / 3
                  },
                  {
                    x: 0,
                    y: 1
                  }
                ],
            fillColor: triangleFillColor
          })
        ]
      }))
    }

    // language
    if (language?.visible) {
      blocks.push(createBlock(BlockType.TEXT, {
        x: width / 2,
        y: (style.padding[0] ?? 0) + lineHeight / 2,
        width,
        height,
        text: `${codeViewer.language}`,
        textAlign: 'center',
        textBaseLine: 'middle',
        fontSize: language.fontSize,
        fillColor: language.color
      }))
    }

    if (canCopy) {
      switch (codeViewer.copyState) {
        case 'Failure':
        case 'Success':
          blocks.push(createBlock(BlockType.TEXT, {
            x: width - (style.padding[1] ?? 0) - DEFAULT_COPY_BUTTON.width / 2,
            y: (style.padding[0] ?? 0) + lineHeight / 2,
            width: DEFAULT_COPY_BUTTON.width,
            height: DEFAULT_COPY_BUTTON.height,
            text: codeViewer.copyState,
            textAlign: 'right',
            textBaseLine: 'middle',
            fillColor: codeViewer.copyState === 'Success'
              ? 'green'
              : 'red'
          }))
          break
        case 'Default':
        default:
          blocks.push(createBlock(BlockType.GROUP, {
            x: width - (style.padding[1] ?? 0) - DEFAULT_COPY_BUTTON.width / 2,
            y: (style.padding[0] ?? 0) + lineHeight / 2,
            width: DEFAULT_COPY_BUTTON.width,
            height: DEFAULT_COPY_BUTTON.height,
            children: [
              createBlock(BlockType.RECTANGLE, {
                x: 4 - (DEFAULT_COPY_BUTTON.width / 2 + 4) / 2,
                y: -4 + (DEFAULT_COPY_BUTTON.height / 2 + 4) / 2,
                width: DEFAULT_COPY_BUTTON.width / 2 + 4,
                height: DEFAULT_COPY_BUTTON.height / 2 + 4,
                strokeColor: DEFAULT_COPY_BUTTON.strokeColor,
                fillColor: DEFAULT_COPY_BUTTON.fillColor,
                radii: 2
              }),
              createBlock(BlockType.RECTANGLE, {
                x: -5 + (DEFAULT_COPY_BUTTON.width / 2 + 5) / 2,
                y: 5 - (DEFAULT_COPY_BUTTON.height / 2 + 5) / 2,
                width: DEFAULT_COPY_BUTTON.width / 2 + 5,
                height: DEFAULT_COPY_BUTTON.height / 2 + 5,
                strokeColor: style.backgroundColor,
                fillColor: style.backgroundColor,
                radii: 2
              }),
              createBlock(BlockType.RECTANGLE, {
                x: -4 + (DEFAULT_COPY_BUTTON.width / 2 + 4) / 2,
                y: 4 - (DEFAULT_COPY_BUTTON.height / 2 + 4) / 2,
                width: DEFAULT_COPY_BUTTON.width / 2 + 4,
                height: DEFAULT_COPY_BUTTON.height / 2 + 4,
                strokeColor: DEFAULT_COPY_BUTTON.strokeColor,
                fillColor: DEFAULT_COPY_BUTTON.fillColor,
                radii: 2
              })
            ]
          }))
          break
      }
    }

    // border
    blocks.push(createBlock(BlockType.LINE, {
      x: width / 2,
      y: height,
      width,
      height: 1,
      points: [
        {
          x: -width / 2 + (codeViewer.collapsed ? typeof borderRadius === 'number' ? borderRadius : 0 : 0),
          y: 0
        },
        {
          x: width / 2 - (codeViewer.collapsed ? typeof borderRadius === 'number' ? borderRadius : 0 : 0),
          y: 0
        }
      ],
      strokeColor: style.borderColor,
      fillColor: 'transparent'
    }))
  }

  return blocks
}
