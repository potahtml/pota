import type { JSX } from './src/jsx/jsx.d.ts'

declare global {
	// accessor

	type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

	type Accessed<T> =
		T extends PromiseLike<infer R>
			? Accessed<R>
			: T extends Derived<infer R>
				? Accessed<R>
				: T extends SignalAccessor<infer R>
					? Accessed<R>
					: T extends SignalFunction<infer R>
						? Accessed<R>
						: T extends { (): infer R }
							? Accessed<R>
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

	type SignalFunction<T> = SignalAccessor<T> &
		((newValue: T) => SignalChanged)

	// signal properties

	type SignalOptions<T> =
		| {
				equals?: false | ((a: T, b: T) => boolean)
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
	type EventName = JSX.EventName
	type EventType = JSX.EventType

	// actual possible events
	type EventHandlersWindow<Element> = JSX.EventHandlersWindow<Element>
	type EventHandlersElement<Element> =
		JSX.EventHandlersElement<Element>

	// event options
	type EventHandlerOptions = JSX.EventHandlerOptions

	// a generic event handler
	type EventFunction<Event, Element> = JSX.EventFunction<
		Event,
		Element
	>
	type EventObject<Event, Element> = JSX.EventObject<Event, Element>
	type EventHandler<Event, Element> = JSX.EventHandler<Event, Element>
	type EventHandlers<Event, Element> = JSX.EventHandlers<
		Event,
		Element
	>

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
	// accessor
	Accessor,
	Accessed,

	// signals
	SignalAccessor,
	SignalSetter,
	SignalUpdate,
	SignalTuple,
	SignalClass,
	SignalObject,
	SignalFunction,
	SignalOptions,
	SignalChanged,
	Derived,

	// control flow
	When,
	Each,

	// components
	Component,
	Children,
	Props,
	ComponentProps,
	Dynamic,

	// dom
	Elements,
	DOMElement,

	// tests
	Expect,
}
