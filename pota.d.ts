import type { JSX } from './src/jsx/jsx.d.ts'

declare global {
  // signal

  type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

  type SignalAccessor<T> = () => T

  type SignalSetter<T> = (newValue?: T) => SignalChanged

  type SignalUpdate<T> = (
    updateFunction: (prevValue: T) => T,
  ) => SignalChanged

  // signal as object/function/tuple

  type SignalTuple<T> = [
    SignalAccessor<T>,
    SignalSetter<T>,
    SignalUpdate<T>,
  ]

  type SignalClass<T> = {
    read: SignalAccessor<T>
    write: SignalSetter<T>
    update: SignalUpdate<T>
  }

  type SignalObject<T> = SignalTuple<T> & SignalClass<T>

  type SignalFunction<T> = {
    (): T
    (newValue: T): SignalChanged
  }

  // signal properties

  type SignalOptions =
    | {
        equals?: false | ((a: unknown, b: unknown) => boolean)
      }
    | undefined

  type SignalChanged = boolean

  // props

  type When<T extends boolean> = Accessor<T>
  type Each<T extends Iterable<T, T, T>> = Accessor<Iterable<T>>

  // components

  type Component = JSX.ElementType
  type Children = JSX.Element

  // tests

  type Expect = {
    toBe: (expected: any) => Promise<any>
    toEqual: (expected: any) => Promise<any>
    not: {
      toBe: (expected: any) => Promise<any>
      toEqual: (expected: any) => Promise<any>
    }
  }

  // dom

  type DOMElement = JSX.DOMElement // TODO

  type TagNames = keyof JSX.IntrinsicElements

  type StylePropertyValue = string | Function | object // TODO
}

export {
  // signals
  Accessor,
  SignalAccessor,
  SignalSetter,
  SignalUpdate,
  SignalTuple,
  SignalClass,
  SignalObject,
  SignalFunction,
  SignalOptions,
  SignalChanged,

  // flow control
  When,
  Each,

  // components
  Component,
  Children,

  // test
  Expect,

  // dom
  DOMElement,
  StylePropertyValue,
}

/** Pota library */
export * from './src/exports.js'

// namespace JSX
export type * from './src/jsx/jsx.d.ts'

/**
 * Needed so LSP works with `JSX` element tags, typescript needs the
 * `jsxs` functions to be defined.
 */
export * from './src/jsx/jsx-runtime.js'
