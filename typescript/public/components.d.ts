/** Props type for the `Dynamic` component */
type Dynamic<T extends JSX.ElementType, P = ComponentProps<T>> = {
	[K in keyof P]: Accessor<P[K]>
} & {
	component: T
}

// context

/** The return type of `context()` */
type Context<T> = {
	/** Run `fn` with the full context value */
	(value: T, fn: () => JSX.Element): JSX.Element
	/** Run `fn` with a partial override of the context value */
	(value: Partial<T>, fn: () => JSX.Element): JSX.Element
	/** Read the current context value */
	(): T
	/**
	 * Component that sets the context value for its children. Prefers
	 * the full-`T` overload when the value is complete; falls back to
	 * `Partial<T>` for override patterns.
	 */
	Provider: {
		(props: { value: T; children?: JSX.Element }): JSX.Element
		(props: {
			value: Partial<T>
			children?: JSX.Element
		}): JSX.Element
	}
	/** Walk parent contexts; return `true` to stop */
	walk: (
		callback: (context: T) => boolean | void,
		context?: T,
	) => boolean
}
