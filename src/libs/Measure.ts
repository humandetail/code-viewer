import type { Style } from '../config/defaultSetting'

export interface Size {
  width: number
  height: number
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!

const getTextSize = (text: string, style: Required<Style>): Size => {
  ctx.save()

  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px/${style.lineHeight}px ${style.fontFamily}`
  const { width } = ctx.measureText(text)
  ctx.restore()

  return {
    width: Math.ceil(width),
    height: style.lineHeight
  }
}

export const getMaxRenderIndex = (text: string, style: Required<Style>, maxWidth: number): number => {
  let content = ''
  let i = 0

  for (; i < text.length; i++) {
    content += text[i]
    if (getTextSize(content, style).width > maxWidth) {
      break
    }
  }

  return i
}

export {
  getTextSize
}
