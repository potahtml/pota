import type { JSX } from '../src/jsx/jsx.d.ts'

declare global {
	// accessor
	export type Accessor<T> =
		| (() => Accessor<T>)
		| SignalAccessor<T>
		| T

	export type Accessed<T> =
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

	export type SignalAccessor<T> = () => T

	export type SignalSetter<T> = (newValue?: T) => SignalChanged

	export type SignalUpdate<T> = (
		updateFunction: (prevValue: T) => T,
	) => SignalChanged

	// signal as object/function/tuple

	export type SignalTuple<T> = readonly [
		SignalAccessor<T>,
		SignalSetter<T>,
		SignalUpdate<T>,
	]

	export type SignalObject<T> = SignalTuple<T> & {
		readonly read: SignalAccessor<T>
		readonly write: SignalSetter<T>
		readonly update: SignalUpdate<T>
	}

	interface SignalFunction<T> {
		(): T
		(value: T): SignalChanged
	}

	// signal properties

	export type SignalOptions<T> =
		| {
				equals?: false | ((a: T, b: T) => boolean)
		  }
		| undefined

	export type SignalChanged = boolean

	// derived

	export type DerivedSignal<R> = {
		(): R // getter
		(value: R): SignalChanged // setter
		run: Function
		resolved: SignalAccessor<boolean>
	}

	export type Derived<R> = DerivedSignal<R> &
		PromiseLike<DerivedSignal<R>>

	// props

	export type When<T> = Accessor<T>
	export type Each<T> = Accessor<Iterable<T>>

	// components

	export type Component = JSX.ElementType
	export type Children = JSX.Element
	export type Elements = JSX.Elements

	export type Props<T = {}> = JSX.Props<T>

	// based on solidjs types
	export type ComponentProps<T> = T extends (props: infer P) => any
		? P
		: T extends keyof JSX.IntrinsicElements
			? JSX.IntrinsicElements[T]
			: Record<string, unknown>

	export type Dynamic<P extends { component: any }> = ComponentProps<
		P['component']
	> & {
		component: P['component']
	}

	// dom

	export type DOMElement = JSX.DOMElement

	export type StyleAttribute = JSX.StyleAttribute

	// events

	// string types of events
	export type EventName = JSX.EventName
	export type EventType = JSX.EventType

	// actual possible events
	export type EventHandlersWindow<Element> =
		JSX.EventHandlersWindow<Element>
	export type EventHandlersElement<Element> =
		JSX.EventHandlersElement<Element>

	// event options
	export type EventHandlerOptions = JSX.EventHandlerOptions

	// a generic event handler
	export type EventFunction<Event, Element> = JSX.EventFunction<
		Event,
		Element
	>
	export type EventEvent<Event, Element> = JSX.EventEvent<
		Event,
		Element
	>
	export type EventObject<Event, Element> = JSX.EventObject<
		Event,
		Element
	>
	export type EventHandler<Event, Element> = JSX.EventHandler<
		Event,
		Element
	>
	export type EventHandlers<Event, Element> = JSX.EventHandlers<
		Event,
		Element
	>

	// callbacks

	export type CallbackElement<Element> = JSX.CallbackElement<Element>
	export type CallbackEvent<Event> = JSX.CallbackEvent<Event>
	export type CallbackEventElement<Event, Element> =
		JSX.CallbackEventElement<Event, Element>

	// tests

	export type Expect = {
		toBe: (expected: unknown) => Promise<unknown>
		toEqual: (expected: unknown) => Promise<unknown>
		not: {
			toBe: (expected: unknown) => Promise<unknown>
			toEqual: (expected: unknown) => Promise<unknown>
		}
	}
}
