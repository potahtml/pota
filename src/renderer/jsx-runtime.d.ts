export namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: any
	}
	interface HTMLAttributes<T> {
		onMount?:
			| ((element: Element) => void)
			| [Function | VoidFunction, ...any]
		onUnmount?:
			| ((element: Element) => void)
			| [Function | VoidFunction, ...any]
	}
}
