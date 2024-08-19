/** Signatures are added via JSDoc. */

type Elements =
  | ((HTMLElement | Element | Node) & EventTarget)
  | null
  | undefined
  | Window
  | typeof globalThis
  | HTMLElement
  | Node
  | Element

// general

type Signal = () => any

type SignalAccessor<T> = () => T

type SignalSetter<T> = (value?: T | any) => SignalChanged

type SignalUpdate<T> = (
  value?: T | any | ((prevValue?: T | any) => any),
) => SignalChanged

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
  | ({
      equals?: false | ((a, b) => boolean)
      label?: string
    } & devToolsArguments)
  | undefined

type SignalChanged = true | false

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

// devTools

type devToolsArguments =
  | {
      __dev?: {
        __pota?: {
          kind?: string
          name?: string

          file?: string

          value?: any
        }
      }
    }
  | undefined

type OwnerOptions = devToolsArguments

/*

https://stackoverflow.com/questions/63553724/filter-interface-keys-for-a-sub-list-of-keys-based-on-value-type

type KeysMatching<T, V> = {[K in keyof T]: T[K] extends V ? K : never}[keyof T];

type SubKeyList = KeysMatching<WindowEventMap, KeyboardEvent>
// type SubkeyList = "keydown" | "keypress" | "keyup"
*/
