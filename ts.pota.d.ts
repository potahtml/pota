/** Signatures are added via JSDoc. */

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

type When = Signal | boolean | unknown

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

type GenericObject<T> = {
  [K in keyof T]: T[K]
}

type Generic<T> = T
