/*
  Types for public facing APIs are added via JSDoc.
*/

export * from './src/renderer/jsx-runtime.d.js'

// types

export type signal = Function
export type element = HTMLElement | Element | Node
export type handler = Function | any[]

// props

export type props = {
  [key: PropertyKey]: any
}
export type children = any

export type when = boolean | signal | unknown

export type each =
  | signal
  | (() => each)
  | unknown[]
  | Map<unknown, unknown>
  | Set<unknown>

// components

export type componenteable =
  | string
  | Element
  | object
  | FunctionConstructor
  | component

export type component =
  | ((props?: props, scope?: unknown) => children)
  | ((props?: props) => children)
  | Function

export as namespace pota
export {}
