/** Signatures are added via JSDoc. */

type Elements = HTMLElement | Element | Node | EventTarget

// general

type Signal = () => any

type SignalOptions =
  | { equals?: false }
  | { equals?: (a, b) => boolean }
  | undefined

type SignalSetter = (
  value?: any | ((prevValue?: any) => any),
) => unknown

type SignalObject<T> = (
  | [Signal, SignalSetter]
  | { read: Signal; write: SignalSetter }
) &
  Iterable<T>

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

type Children = any

type Component = ((props?: Props) => Children) | Function

type Componenteable =
  | string
  | Elements
  | object
  | FunctionConstructor
  | Component

// objects

type GenericObject<T> = {
  [K in keyof T]: T[K]
}

type Generic<T> = T

// tests

type Expect = {
  toBe: (expected: any) => Promise<any>
  toHaveShape: (expected: any) => Promise<any>
  not: {
    toBe: (expected: any) => Promise<any>
    toHaveShape: (expected: any) => Promise<any>
  }
}
