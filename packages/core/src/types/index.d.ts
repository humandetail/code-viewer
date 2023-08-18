export type TupleToRecord<T extends readonly string[], V> = {
  [K in T[number]]?: V
}

export type MergeRecord<F, S> = {
  [P in keyof F | keyof S]: P extends keyof S ? S[P] : P extends keyof F ? F[P] : never
}

export type MarkRequired<T, E> = {
  [P in keyof T]: P extends E ? T[P] : Exclude<T[P], undefined>
}

export interface Coordinate {
  x: number
  y: number
}

export type Color = string | CanvasGradient | CanvasPattern

export interface Shadow {
  color: string
  blur: number
  offsetX?: number
  offsetY?: number
}

export type TextAlign = 'center' | 'left' | 'right'
export type TextBaseLine = 'middle' | 'top' | 'bottom'
export type FontStyle = 'normal' | 'italic' | 'oblique' | string

export type Radii = number | DOMPointInit | Iterable<number | DOMPointInit>

export interface Point extends Coordinate {}
