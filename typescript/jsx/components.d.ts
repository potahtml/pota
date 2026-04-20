/// <reference path="./namespace.d.ts" />

// component utility types

/** A function component that accepts props `P` */
type Component<P = {}> = (props: P) => JSX.Element

/** A component whose props include `children` */
type ParentComponent<P = {}> = Component<
	P & { children?: JSX.Element }
>

/** A component with no `children` prop */
type VoidComponent<P = {}> = Component<P>

/** A function or class component that accepts props `P` */
type ComponentType<P = {}> =
	| Component<P>
	| (new (
			props: P,
	  ) => JSX.ElementClass)

/**
 * A flow-control component (like Show, For). `C` is the children type
 * — defaults to `JSX.Element`, but can be a render callback.
 */
type FlowComponent<P = {}, C = JSX.Element> = Component<
	P & { children?: C }
>

/** Callback children — single or array mixed with elements */
type Children<C> = C | (C | JSX.Element)[]

// prop extraction

/** Extracts the props type from a component function or tag name */
type ComponentProps<T> = T extends (props: infer P) => any
	? P
	: T extends keyof JSX.IntrinsicElements
		? JSX.IntrinsicElements[T]
		: Record<string, unknown>
