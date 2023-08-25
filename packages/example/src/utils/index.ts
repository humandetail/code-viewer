((doc: any) => {
  if (!doc.startViewTransition) {
    doc.startViewTransition = <T extends (...args: any) => any>(cb: T) => cb()
  }
})(document)

export const startViewTransition = <T extends (...args: any) => any>(cb: T): void => {
  (document as any).startViewTransition(cb)
}
