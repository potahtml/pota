// signal

type SignalAccessor<out T> = () => T

type SignalSetter<in T> = (newValue?: T) => SignalChanged

type SignalUpdate<T> = {
  (newValue?: T): SignalChanged
  (fn: (prevValue: T) => T): SignalChanged
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
