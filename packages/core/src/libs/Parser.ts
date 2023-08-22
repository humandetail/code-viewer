import hljs from 'highlight.js'
import { type Style, type ScopeStyles, BTN_COPY_ID, BTN_COLLAPSE_ID } from '../config/defaultSetting'
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
  scope?: string
}

export interface LineNumber {
  display: boolean
  value: number
  width: number
  height: number
  left: number
}

export interface Row extends Size {
  lineNumber: LineNumber
  children: InlineItem[]
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

const rowsToBlocks = (
  codeViewer: CodeViewer,
  rows: Row[]
): Block[] => {
  if (rows.length === 0) return []

  const {
    breakRow,
    displayLineNumber,
    headerBarSetting,
    width,
    style: {
      padding: [padTop, padRight, , padLeft],
      lineHeight,
      fontSize,
      fontStyle,
      fontWeight
    },
    lineNumberStyle,
    headerBarStyle
  } = codeViewer

  const maxContentWidth = breakRow
    ? width - (padRight ?? 0) - (padLeft ?? 0)
    : Infinity

  const maxLineNumber = Math.max.apply(null, rows.map(({ lineNumber }) => lineNumber.value))
  const lineNumberWidth = displayLineNumber
    ? (lineNumberStyle.padding ?? 0) * 2 + getTextSize(`${maxLineNumber}`, rows[0].children[0].style).width
    : 0

  const baseLeft = lineNumberWidth + (padLeft ?? 0)
  let baseTop = (padTop ?? 0) + (
    headerBarSetting.visible
      ? (headerBarStyle.padding[0] ?? 0) + (headerBarStyle.padding[2] ?? 0) + lineHeight
      : 0
  )

  const blocks: Block[] = []

  rows.forEach(({ lineNumber, children: _children }) => {
    const children = [..._children]
    let left = 0
    let top = 0

    for (let i = 0; i < children.length; i++) {
      const {
        content,
        style: itemStyle,
        size: {
          width: itemWidth,
          height: itemHeight
        }
      } = children[i]

      const {
        textAlign,
        textBaseLine,
        fontSize,
        fontWeight,
        fontStyle,
        color
      } = itemStyle
      const remainingWidth = maxContentWidth - baseLeft - itemWidth - left

      // If the next render is going to be out of range,
      // first render part of the content that is sufficient to render,
      // and then move the remaining content to the next item.
      if (remainingWidth < 0) {
        const idx = getMaxRenderIndex(content, itemStyle, remainingWidth + itemWidth)

        const newContent = content.slice(0, idx)
        const nextContent = content.slice(idx)

        const newContentWidth = getTextSize(newContent, itemStyle).width

        blocks.push(
          createBlock(BlockType.TEXT, {
            x: baseLeft + left + newContentWidth / 2,
            y: baseTop + top + itemHeight / 2,
            width: getTextSize(newContent, itemStyle).width,
            height: itemHeight,
            z: 0,
            angle: 0,
            fixed: Fixed.UNSET,
            opacity: 1,
            shadow: undefined,
            text: newContent,
            textAlign,
            textBaseLine,
            fontSize,
            fontWeight,
            fontStyle,
            lineHeight,
            fillColor: color,
            strokeColor: 'transparent'
          })
        )

        top += lineHeight
        left = 0

        children.splice(i, 1, null as unknown as any, {
          ...children[i],
          size: getTextSize(nextContent, itemStyle),
          content: nextContent
        })
      } else {
        blocks.push(createBlock(BlockType.TEXT, {
          x: baseLeft + left + itemWidth / 2,
          y: baseTop + top + itemHeight / 2,
          width: itemWidth,
          height: itemHeight,
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

        left += itemWidth
      }
    }

    if (displayLineNumber) {
      const lineNumberHeight = top + lineHeight

      blocks.push(createBlock(BlockType.GROUP, {
        x: lineNumberWidth / 2,
        y: baseTop + lineNumberHeight / 2,
        z: 1,
        angle: 0,
        width: lineNumberWidth,
        height: lineNumberHeight,
        fixed: Fixed.LEFT,
        opacity: 1,
        shadow: undefined,
        children: [
          ...lineNumberStyle.backgroundColor !== 'transparent'
            ? [createBlock(BlockType.RECTANGLE, {
                x: 0,
                y: 0,
                z: 1,
                angle: 0,
                width: lineNumberWidth,
                height: lineNumberHeight,
                fillColor: lineNumberStyle.backgroundColor
              })]
            : [],
          createBlock(BlockType.TEXT, {
            x: 0,
            y: -(lineNumberHeight - lineHeight) / 2,
            angle: 0,
            width: lineNumberWidth - (lineNumberStyle.padding ?? 0) * 2,
            height: lineNumberHeight,
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
            x: lineNumberWidth / 2,
            y: 0,
            width: 1,
            height: lineNumberHeight,
            points: [{
              x: 0,
              y: -lineNumberHeight / 2
            }, {
              x: 0,
              y: lineNumberHeight / 2
            }],
            strokeColor: lineNumberStyle.borderColor
          })
        ]
      }))
    }

    baseTop += top + lineHeight
    left = 0
    top = 0
  })

  return blocks
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
      width: 0,
      height: 0,
      lineNumber: {
        display: false,
        value: lineNumber++,
        width: 0,
        height: 0,
        left: 0
      },
      children
    })
  }

  list.forEach(({ scope, content }) => {
    const currentStyle = getScopeStyle(scope as keyof ScopeStyles)

    if (LF_REGEX.test(content)) {
      splitLF(content).forEach((item, index, sourceArr) => {
        if (item) {
          children.push({
            scope,
            content: item,
            style: currentStyle,
            size: getTextSize(item, currentStyle)
          })
        }

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
        size: getTextSize(content, currentStyle)
      })
    }
  })

  if (children.length !== 0) {
    pushRow(children)
  }

  return rows
}

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
    toCurry<any>(rowsToBlocks)(codeViewer),
    toCurry<any>(mergeData)(codeViewer.getScopeStyle.bind(codeViewer)),
    flatScopeDataList
  )(scopeDataList)
}

export const parseHeaderBar = (codeViewer: CodeViewer) => {
  const children: Block[] = []

  const {
    width: codeViewerWidth,
    isCollapsed,
    headerBarSetting: {
      visible,
      displayLanguage,
      collapsible,
      copyable
    },
    style: {
      lineHeight,
      borderRadius
    },
    headerBarStyle: {
      padding: headerBarPadding,
      backgroundColor: headerBarBackgroundColor,
      borderColor: headerBarBorderColor,
      copyButton: {
        size: copyButtonSize,
        fillColor: copyButtonFillColor,
        strokeColor: copyButtonStrokeColor
      },
      collapseButton: {
        size: collapseButtonSize,
        fillColor: collapseButtonFillColor,
        strokeColor: collapseButtonStrokeColor
      },
      language: {
        fontSize: languageFontSize,
        color: languageColor
      }
    }
  } = codeViewer

  const height = (headerBarPadding?.[0] ?? 0) + lineHeight + (headerBarPadding?.[2] ?? 0)

  if (visible) {
    // bg
    children.push(createBlock(BlockType.RECTANGLE, {
      x: 0,
      y: 0,
      width: codeViewerWidth,
      height,
      radii: borderRadius,
      fillColor: headerBarBackgroundColor
    }))

    // btn-collapse
    if (collapsible) {
      children.push(createBlock(BlockType.GROUP, {
        id: BTN_COLLAPSE_ID,
        x: -codeViewerWidth / 2 + (headerBarPadding.at(-1) ?? 0) + collapseButtonSize / 2,
        y: 0,
        width: collapseButtonSize,
        height: collapseButtonSize,
        angle: 45,
        children: [
          createBlock(BlockType.LINE, {
            x: 0,
            y: -collapseButtonSize / 4,
            width: collapseButtonSize / 4,
            height: collapseButtonSize / 2 - 2,
            points: !codeViewer.isCollapsed
              ? [
                  {
                    x: 0,
                    y: collapseButtonSize / 6
                  },
                  {
                    x: -collapseButtonSize / 4,
                    y: -1
                  },
                  {
                    x: collapseButtonSize / 4,
                    y: -1
                  },
                  {
                    x: 0,
                    y: collapseButtonSize / 6
                  }
                ]
              : [
                  {
                    x: 0,
                    y: -1
                  },
                  {
                    x: -collapseButtonSize / 4,
                    y: collapseButtonSize / 6
                  },
                  {
                    x: collapseButtonSize / 4,
                    y: collapseButtonSize / 6
                  },
                  {
                    x: 0,
                    y: -1
                  }
                ],
            fillColor: collapseButtonFillColor,
            strokeColor: collapseButtonStrokeColor
          }),
          createBlock(BlockType.LINE, {
            x: 0,
            y: collapseButtonSize / 4,
            width: collapseButtonSize / 4,
            height: collapseButtonSize / 2 - 2,
            points: !codeViewer.isCollapsed
              ? [
                  {
                    x: 0,
                    y: -collapseButtonSize / 6
                  },
                  {
                    x: -collapseButtonSize / 4,
                    y: 1
                  },
                  {
                    x: collapseButtonSize / 4,
                    y: 1
                  },
                  {
                    x: 0,
                    y: -collapseButtonSize / 6
                  }
                ]
              : [
                  {
                    x: 0,
                    y: 1
                  },
                  {
                    x: -collapseButtonSize / 4,
                    y: -collapseButtonSize / 6
                  },
                  {
                    x: collapseButtonSize / 4,
                    y: -collapseButtonSize / 6
                  },
                  {
                    x: 0,
                    y: 1
                  }
                ],
            fillColor: collapseButtonFillColor,
            strokeColor: collapseButtonStrokeColor
          })
        ]
      }))
    }

    // language
    if (displayLanguage) {
      children.push(createBlock(BlockType.TEXT, {
        x: 0,
        y: 0,
        width: codeViewerWidth,
        height,
        text: `${codeViewer.language}`,
        textAlign: 'center',
        textBaseLine: 'middle',
        fontSize: languageFontSize,
        fillColor: languageColor
      }))
    }

    if (copyable) {
      switch (codeViewer.copyState) {
        case 'Failure':
        case 'Success':
          children.push(createBlock(BlockType.TEXT, {
            x: codeViewerWidth / 2 - (headerBarPadding[1] ?? 0) - copyButtonSize / 2,
            y: 0,
            fixed: Fixed.BOTH,
            width: copyButtonSize,
            height: copyButtonSize,
            text: codeViewer.copyState,
            textAlign: 'right',
            textBaseLine: 'middle',
            fillColor: codeViewer.copyState === 'Success'
              ? '#52c41a'
              : '#f5222d'
          }))
          break
        case 'Default':
        default:
          if (!isCollapsed) {
            children.push(createBlock(BlockType.GROUP, {
              id: BTN_COPY_ID,
              x: codeViewerWidth / 2 - (headerBarPadding[1] ?? 0) - copyButtonSize / 2,
              y: 0,
              fixed: Fixed.BOTH,
              width: copyButtonSize,
              height: copyButtonSize,
              children: [
                createBlock(BlockType.RECTANGLE, {
                  x: 4 - (copyButtonSize / 2 + 4) / 2,
                  y: -4 + (copyButtonSize / 2 + 4) / 2,
                  width: copyButtonSize / 2 + 4,
                  height: copyButtonSize / 2 + 4,
                  strokeColor: copyButtonStrokeColor,
                  fillColor: copyButtonFillColor,
                  radii: 2
                }),
                createBlock(BlockType.RECTANGLE, {
                  x: -5 + (copyButtonSize / 2 + 5) / 2,
                  y: 5 - (copyButtonSize / 2 + 5) / 2,
                  width: copyButtonSize / 2 + 5,
                  height: copyButtonSize / 2 + 5,
                  strokeColor: headerBarBackgroundColor,
                  fillColor: headerBarBackgroundColor,
                  radii: 2
                }),
                createBlock(BlockType.RECTANGLE, {
                  x: -4 + (copyButtonSize / 2 + 4) / 2,
                  y: 4 - (copyButtonSize / 2 + 4) / 2,
                  width: copyButtonSize / 2 + 4,
                  height: copyButtonSize / 2 + 4,
                  strokeColor: copyButtonStrokeColor,
                  fillColor: copyButtonFillColor,
                  radii: 2
                })
              ]
            }))
          }
          break
      }
    }

    // border
    if (!isCollapsed) {
      children.push(createBlock(BlockType.LINE, {
        x: 0,
        y: height / 2,
        fixed: Fixed.BOTH,
        width: codeViewerWidth,
        height: 1,
        points: [
          {
            x: -codeViewerWidth / 2,
            y: 0
          },
          {
            x: codeViewerWidth / 2,
            y: 0
          }
        ],
        strokeColor: headerBarBorderColor,
        fillColor: 'transparent'
      }))
    }
  }

  return [
    createBlock(BlockType.GROUP, {
      x: codeViewerWidth / 2,
      y: height / 2,
      z: 8,
      fixed: Fixed.BOTH,
      width: codeViewerWidth,
      height,
      children
    })
  ]
}
