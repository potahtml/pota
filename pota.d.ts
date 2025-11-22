import type { JSX } from './src/jsx/jsx.d.ts'

declare global {
	// accessor

	type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

	type Accessed<T> = T extends () => infer R
		? Accessed<R>
		: T extends PromiseLike<infer V>
			? Accessed<V>
			: T extends SignalAccessor<infer S>
				? Accessed<S>
				: T extends SignalFunction<infer F>
					? Accessed<F>
					: T extends Derived<infer D>
						? Accessed<D>
						: T

	// signal

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

	// derived

	type Derived<T> = SignalFunction<T> & {
		run: Function
		resolved: SignalAccessor<boolean>
	}

	// props

	type When<T> = Accessor<T>
	type Each<T> = Accessor<Iterable<T>>

	// components

	type Component = JSX.ElementType
	type Children = JSX.Element
	type Elements = JSX.Elements

	type Props<T = {}> = JSX.Props<T>

	// based on solidjs types
	type ComponentProps<T /*extends ValidComponent*/> = T extends (
		props: infer P,
	) => any
		? P
		: T extends keyof JSX.IntrinsicElements
			? JSX.IntrinsicElements[T]
			: Record<string, unknown>

	type Dynamic<T, P = ComponentProps<T>> = {
		[K in keyof P]: P[K]
	} & {
		component: T
	}

	// dom

	type DOMElement = JSX.DOMElement

	type StyleAttribute = JSX.StyleAttribute

	// events

	// string types of events
	type EventType = JSX.EventType

	// actual possible events
	type EventHandlersWindow<Element> = JSX.EventHandlersWindow<Element>
	type EventHandlersElement<Element> =
		JSX.EventHandlersElement<Element>

	// event options
	type EventHandlerOptions = JSX.EventHandlerOptions

	// a generic event handler
	type EventHandler<Event, Element> = JSX.EventHandler<Event, Element>

	// callbacks

	type CallbackElement<Element> = JSX.CallbackElement<Element>
	type CallbackEvent<Event> = JSX.CallbackEvent<Event>
	type CallbackEventElement<Event, Element> =
		JSX.CallbackEventElement<Event, Element>

	// tests

	type Expect = {
		toBe: (expected: unknown) => Promise<unknown>
		toEqual: (expected: unknown) => Promise<unknown>
		not: {
			toBe: (expected: unknown) => Promise<unknown>
			toEqual: (expected: unknown) => Promise<unknown>
		}
	}
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

// Pota library
export * from './types/exports.d.ts'

// namespace JSX
export type * from './src/jsx/jsx.d.ts'

/**
 * Needed so LSP works with `JSX` element tags, typescript needs the
 * `jsxs` functions to be defined.
 */
export * from './types/jsx/jsx-runtime.d.ts'
