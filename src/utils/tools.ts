export const LF_Regex = /\n(?<=[^\\])/

export const isObject = (val: unknown): val is object => {
  return Object.prototype.toString.call(val) === '[object Object]'
}

export const isArray = (val: unknown): val is Array<unknown> => {
  return Array.isArray(val)
}

export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}

export const isEmptyObject = (val: unknown): val is object => {
  if (!val) return true

  return JSON.stringify(val) === '{}'
}

export const includeLineBreak = (str: string) => {
  return LF_Regex.test(str)
}

export const splitLF = (str: string) => str.split(LF_Regex)

export const deepMergeObject = <O extends Record<any, any>, T extends Record<any, any>>(target: O, source: T) => {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if ((source[key] as any) instanceof Object && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          (target[key] as any) = {}
        }
        deepMergeObject(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
}

export const isAllZero = (val: number | [number, number, number, number]) => {
  return typeof val === 'number'
    ? val === 0
    : val.every(i => i === 0)
}

export const isAllTransparent = (val: string | [string, string, string, string]) => {
  return typeof val === 'string'
    ? val.toLowerCase() === 'transparent'
    : val.every(i => i.toLowerCase() === 'transparent')
}
