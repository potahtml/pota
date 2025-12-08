import type * as T from './pota.d.ts'

declare global {
	// accessor
	type Accessor<T> = T.Accessor<T>
	type Accessed<T> = T.Accessed<T>

	// signals
	type SignalAccessor<T> = T.SignalAccessor<T>
	type SignalSetter<T> = T.SignalSetter<T>
	type SignalUpdate<T> = T.SignalUpdate<T>
	type Derived<R> = T.Derived<R>

	// signal as object/function/tuple
	type SignalTuple<T> = T.SignalTuple<T>
	type SignalObject<T> = T.SignalObject<T>
	type SignalFunction<T> = T.SignalFunction<T>

	// signal properties
	type SignalOptions<T> = T.SignalOptions<T>
	type SignalChanged = T.SignalChanged

	// control flow
	type When<T> = T.When<T>
	type Each<T> = T.Each<T>

	// components
	type Component = T.Component
	type Children = T.Children
	type Elements = T.Elements
	type Props<T = {}> = T.Props<T>
	type ComponentProps<T> = T.ComponentProps<T>
	type Dynamic<T> = T.Dynamic<T>

	// dom
	type DOMElement = T.DOMElement
	type StyleAttribute = T.StyleAttribute

	// events
	type EventName = T.EventName
	type EventType = T.EventType

	type EventHandlersWindow<Element> = T.EventHandlersWindow<Element>
	type EventHandlersElement<Element> = T.EventHandlersElement<Element>

	type EventHandlerOptions = T.EventHandlerOptions

	type EventFunction<Event, Element> = T.EventFunction<Event, Element>
	type EventEvent<Event, Element> = T.EventEvent<Event, Element>
	type EventObject<Event, Element> = T.EventObject<Event, Element>
	type EventHandler<Event, Element> = T.EventHandler<Event, Element>
	type EventHandlers<Event, Element> = T.EventHandlers<Event, Element>

	// callbacks
	type CallbackElement<Element> = T.CallbackElement<Element>
	type CallbackEvent<Event> = T.CallbackEvent<Event>
	type CallbackEventElement<Event, Element> = T.CallbackEventElement<
		Event,
		Element
	>

	// tests
	type Expect = T.Expect
}

export {}
