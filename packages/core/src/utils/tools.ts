import { type ScopeStyles, type Style } from '../config/defaultSetting'
import type { Coordinate } from '../types'

type CurryFunction<T> = (arg: T) => T | CurryFunction<T>
type ComposeFunction = <T>(...funcs: Array<(arg: T) => T>) => (arg: T) => T

export const LF_REGEX = /\n(?<=[^\\])/

export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}

export const isEmptyObject = (val: unknown): val is object => {
  if (!val) return true

  return JSON.stringify(val) === '{}'
}

export const includeLineBreak = (str: string) => {
  return LF_REGEX.test(str)
}

export const splitLF = (str: string) => str.split(LF_REGEX)

export const deepMergeObject = <O extends Record<any, any>, T extends Record<any, any>>(target: O, source: T) => {
  for (const key in source) {
    if (Object.hasOwn(source, key)) {
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

export const compose: ComposeFunction = (...funcs) => (arg) => {
  return funcs.reduceRight((acc, func) => func(acc), arg)
}

export const toCurry = <T>(fn: (...args: T[]) => T, arity = fn.length): (arg: T) => T | CurryFunction<T> => {
  return function curried (...args: T[]): T | CurryFunction<T> {
    if (args.length >= arity) {
      return fn(...args)
    } else {
      return (...nextArgs: T[]) => curried(...args.concat(nextArgs))
    }
  }
}

export const getMouseCoordinate = (e: MouseEvent): Coordinate => {
  const target = e.target as HTMLEmbedElement

  if (!('innerHTML' in target)) {
    throw new TypeError('Event target expect a HTMLElement but got', target)
  }

  const {
    clientX,
    clientY
  } = e
  const { left, top } = target.getBoundingClientRect()

  return {
    x: clientX - left,
    y: clientY - top
  }
}

export const createRandomId = (suffix = '') => {
  return `${suffix}${Date.now()}${Math.random().toString().slice(2, 8)}`
}

export const getScopeStyle = (
  scope: keyof ScopeStyles,
  scopeStyles: ScopeStyles,
  defaultStyle: Required<Style>
): Required<Style> => {
  if (!scope) {
    return defaultStyle
  }

  const fullScopeStyle = scopeStyles[scope] as Required<Style>

  if ((scope as string).includes('.')) {
    const s = (scope as string).split('.').reduce<Style>((prev, key) => {
      const s = scopeStyles[key as keyof ScopeStyles] as Required<Style>
      if (s) {
        Object.assign(prev, s)
      }

      return prev
    }, {})

    if (!isEmptyObject(fullScopeStyle)) {
      Object.assign(s, fullScopeStyle)
    }

    return {
      ...defaultStyle,
      ...s
    }
  }

  return {
    ...defaultStyle,
    ...fullScopeStyle
  }
}
