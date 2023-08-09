export type TupleToRecord<T extends readonly string[], V> = {
  [K in T[number]]?: V
}