import './ts.pota.d.ts'

export namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }

  // this doesnt seem to be working
  interface HTMLAttributes<T> {
    onMount?:
      | ((element: T) => void)
      | [Function | VoidFunction, ...any]
    onUnmount?:
      | ((element: T) => void)
      | [Function | VoidFunction, ...any]
  }
}
