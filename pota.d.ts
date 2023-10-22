/**
 * Types for public facing APIs are added via JSDoc.
 *
 * Typings is a work in progress, and there could be some non-sense.
 * Contributions welcome.
 */

export * from './src/renderer/jsx/jsx-runtime.d.js'

// types

export type Signal = Function
export type Element = HTMLElement | Node
export type Handler =
  | Function
  | VoidFunction
  | [VoidFunction | Function, ...any]

// props

export type Props = {
  [key: PropertyKey]: any
}

export type Children = any

export type When = Signal | boolean | unknown

export type Each =
  | Signal
  | (() => Each)
  | unknown[]
  | Map<unknown, unknown>
  | Set<unknown>

// components

export type Componenteable =
  | string
  | Element
  | object
  | FunctionConstructor
  | Component

export type Component =
  | ((props?: Props, scope?: unknown) => Children)
  | ((props?: Props) => Children)
  | Function

export as namespace pota
export {}
