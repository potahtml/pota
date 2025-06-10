import type { JSX } from './src/jsx/jsx.d.ts'

declare global {
	// signal

	type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

	type Accessed<T> = T extends () => infer R ? Accessed<R> : T

	type SignalAccessor<T> = () => T

	type SignalSetter<T> = (newValue?: T) => SignalChanged

	type SignalUpdate<T> = (
		updateFunction: (prevValue: T) => T,
	) => SignalChanged

	// signal as object/function/tuple

	type SignalTuple<T> = readonly [
		SignalAccessor<T>,
		SignalSetter<T>,
		SignalUpdate<T>,
	]

	type SignalClass<T> = {
		readonly read: SignalAccessor<T>
		readonly write: SignalSetter<T>
		readonly update: SignalUpdate<T>
	}

	type SignalObject<T> = SignalTuple<T> & SignalClass<T>

	type SignalFunction<T> = SignalAccessor<T> | SignalSetter<T>

	// signal properties

	type SignalOptions =
		| {
				equals?: false | ((a: unknown, b: unknown) => boolean)
		  }
		| undefined

	type SignalChanged = boolean

	// props

	type When<T> = Accessor<T>
	type Each<T> = Accessor<Iterable<T>>

	// components

	type Component = JSX.ElementType
	type Children = JSX.Element
	type Elements = JSX.Elements
	type Props<T = {}> = JSX.Props<T>

	// dom

	type DOMElement = JSX.DOMElement

	type StyleAttribute = JSX.StyleAttribute

	// events

	type EventType = JSX.EventType

	type EventHandlersWindow<T> = JSX.EventHandlersWindow<T>
	type EventHandlersElement<T> = JSX.EventHandlersElement<T>

	type EventHandlerOptions = JSX.EventHandlerOptions

	type EventHandler<T> = JSX.EventHandler<T>

	// tests

	type Expect = {
		toBe: (expected: unknown) => Promise<unknown>
		toEqual: (expected: unknown) => Promise<unknown>
		not: {
			toBe: (expected: unknown) => Promise<unknown>
			toEqual: (expected: unknown) => Promise<unknown>
		}
	}

	// stuff

	type Callback<T> = (value: T) => unknown
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

	// tests
	Expect,
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
