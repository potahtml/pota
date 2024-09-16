/*
todo
- do not use properties as attributes
- title case events
- css for style attribute
- JSX.DOM<HTMLMetaElement> -> JSX.DOM.meta
- export JSX from main
- maybe give namespaced attributes as generic till its typed
*/

export namespace JSX {
	// dom elements

	interface DOMElements
		extends HTMLElementTagNameMap,
			ElementsFilter<SVGElementTagNameMap>,
			ElementsFilter<MathMLElementTagNameMap>,
			ElementsFilter<HTMLElementDeprecatedTagNameMap> {}

	// attributes

	type PotaAttributes<T> = {
		ref?: SignalSetter<T>
		onMount?: (element: T) => void
		onUnmount?: (element: T) => void

		// css
		class?: any
		style?: any
		[attr: `class:${string}`]: any
		[attr: `var:${string}`]: any
		css?: any
	}

	// explicit attributes

	interface ExplicitProperties {}
	interface ExplicitAttributes {}
	interface ExplicitBoolAttributes {}

	type NSProp = NSAttributeMap<'prop', ExplicitProperties>
	type NSAttr = NSAttributeMap<'attr', ExplicitAttributes>
	type NSBool = NSAttributeMap<'bool', ExplicitBoolAttributes>

	// events

	type NSEvents = EventsNSMap<HTMLElementEventMap>
	type EventsCapitalize = EventsCapitalizeMap<HTMLElementEventMap>

	// all attributes + events

	interface IntrinsicAttributes<T>
		extends PotaAttributes<T>,
			NSProp,
			NSAttr,
			NSBool,
			NSEvents,
			EventsCapitalize {}

	type DOMAttributes<el> = {
		[K in keyof el as `${string & K}`]?: el[K]
	}

	type DOM<T> = DOMAttributes<T> & IntrinsicAttributes<T>

	// IntrinsicElements + element

	type Elements<eles> = {
		[K in keyof eles]: DOM<eles[K]>
	}

	interface IntrinsicElements extends Elements<DOMElements> {
		[elemName: string]: any
	}

	export type Element =
		| string
		| number
		| bigint
		| Element[]
		| (() => Element)
		| Promise<Element>
		| boolean
		| object
		| symbol
		| undefined
		| void
		| DOM
}

// utils

type ElementsFilter<TagNameMap> = Pick<
	TagNameMap,
	Exclude<keyof TagNameMap, keyof HTMLElementTagNameMap>
>

type NSAttributeMap<attr, Map> = {
	[Key in keyof Map as `${string & attr}:${string & Key}`]?: Map[Key]
}

type EventsCapitalizeMap<Events> = {
	[Key in keyof Events as `on${Capitalize<string & Key>}`]?: (
		e: Events[Key],
	) => void
}
type EventsNSMap<Events> = {
	[Key in keyof Events as `on:${string & Key}`]?: (
		e: Events[Key],
	) => void
}
