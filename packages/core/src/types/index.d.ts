export type TupleToRecord<T extends readonly string[], V> = {
  [K in T[number]]?: V
}

export interface Coordinate {
  x: number
  y: number
}

export type Color = string | CanvasGradient | CanvasPattern
