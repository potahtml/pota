/**
 * PAIN
 *
 * Signatures are added via JSDoc.
 */

// general

type Signal = Function
type Elements = HTMLElement | Element | Node | EventTarget
type Handler =
  | Function
  | VoidFunction
  | [VoidFunction | Function, ...any]

// props

type Props = {
  [key: PropertyKey]: any
}

type Children = any

type When = Signal | boolean | unknown

type Each =
  | Signal
  | (() => Each)
  | unknown[]
  | Map<unknown, unknown>
  | Set<unknown>

// components

type Component =
  | ((props?: Props, scope?: unknown) => Children)
  | ((props?: Props) => Children)
  | Function

type Componenteable =
  | string
  | Elements
  | object
  | FunctionConstructor
  | Component

type Mutable<T> = {
  [K in keyof T]: T[K]
}

type FunctionT<T> = T
