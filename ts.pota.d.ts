// signal

type SignalAccessor<out T> = () => T

type SignalSetter<in T> = (newSignalValue?: T) => SignalChanged

type SignalUpdate<T> = {
  (newSignalValue?: T): SignalChanged
  (fn: (prevSignalValue: T) => T): SignalChanged
}

type SignalFunction<T> = {
  (): T
  (newValue: T): SignalChanged
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

// props

type When<T> = SignalAccessor<T> | boolean

type Each<T> = SignalAccessor<T> | Iterable<T>

// components

type Component = (props?) => Children

type Children = JSX.Element

type TagNames =
  | keyof HTMLElementTagNameMap
  | keyof SVGElementTagNameMap
  | keyof MathMLElementTagNameMap
  | keyof HTMLElementDeprecatedTagNameMap

// tests

type Expect = {
  toBe: (expected: any) => Promise<any>
  toEqual: (expected: any) => Promise<any>
  not: {
    toBe: (expected: any) => Promise<any>
    toEqual: (expected: any) => Promise<any>
  }
}
