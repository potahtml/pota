/** sorry, bit messy slowly improving */

// signal

type Signal = () => any

type SignalAccessor<out T> = () => T

type SignalSetter<in T> = (newSignalValue?: T) => SignalChanged

type SignalUpdate<T> = {
  (newSignalValue?: T): SignalChanged
  (fn: (prevSignalValue: T) => T): SignalChanged
}

type SignalObject<T> = [
  SignalAccessor<T>,
  SignalSetter<T>,
  SignalUpdate<T>,
] & {
  read: SignalAccessor<T>
  write: SignalSetter<T>
  update: SignalUpdate<T>
}

type SignalOptions =
  | {
      equals?: false | ((a, b) => boolean)
    }
  | undefined

type SignalChanged = true | false

type SignalFunction<T> = {
  (): T
  (newValue: T): SignalChanged
}

// props

type Props = {
  [key: PropertyKey]: any
}

type When = Signal | boolean | any

type Each =
  | Signal
  | (() => Each)
  | unknown[]
  | Map<unknown, unknown>
  | Set<unknown>

// components

type Elements =
  | ((HTMLElement | Element | Node) & EventTarget)
  | null
  | undefined
  | Window
  | typeof globalThis
  | HTMLElement
  | Node
  | Element

type Children = any

type Component = ((props?: Props) => Children) | Function

type Componenteable =
  | string
  | Elements
  | object
  | FunctionConstructor
  | Component

// tests

type Expect = {
  toBe: (expected: any) => Promise<any>
  toHaveShape: (expected: any) => Promise<any>
  not: {
    toBe: (expected: any) => Promise<any>
    toHaveShape: (expected: any) => Promise<any>
  }
}
