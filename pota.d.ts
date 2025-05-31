// signal

type MaybeAccessor<T> = SignalAccessor<T> | T

type SignalAccessor<out T> = () => T

type SignalSetter<in T> = (newValue?: T) => SignalChanged

type SignalUpdate<in out T> = {
  (newValue?: T): SignalChanged
  (fn: (prevValue: T) => T): SignalChanged
}

// signal as object/function/tuple

type SignalObject<T> = SignalTuple<T> & SignalClass<T>

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

type SignalFunction<T> = {
  (): T
  (newValue: T): SignalChanged
}

// signal properties

type SignalOptions =
  | {
      equals?: false | ((a, b) => boolean)
    }
  | undefined

type SignalChanged = boolean

// props

type When<T> = SignalAccessor<T> | boolean

type Each<T> = SignalAccessor<T> | Iterable<T>

// components

type Component = import('./jsx.d.ts').JSX.ElementType

type Children = import('./jsx.d.ts').JSX.Element

type TagNames = keyof import('./jsx.d.ts').JSX.IntrinsicElements

// tests

type Expect = {
  toBe: (expected: any) => Promise<any>
  toEqual: (expected: any) => Promise<any>
  not: {
    toBe: (expected: any) => Promise<any>
    toEqual: (expected: any) => Promise<any>
  }
}

// overrides

//  (sorry not sorry)
interface Element {
  isCustomElement: boolean
}

// globals

type DOMElement = import('./jsx.d.ts').JSX.DOMElement // TODO

type StylePropertyValue = string | Function | object // TODO
