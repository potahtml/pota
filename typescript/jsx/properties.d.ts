/** Base-class properties shared by all elements — skip from `prop:*`. */
type SkipPropsFrom = HTMLUnknownElement & HTMLElement & Element & Node

/**
 * Value types allowed on a `prop:*`. Primitives plus the writable
 * non-primitive DOM-object props worth exposing:
 *
 * - `HTMLMediaElement.srcObject`
 * - `HTMLButtonElement.popoverTargetElement` / `commandForElement` (and
 *   the same via PopoverTargetAttributes mixin on HTMLInputElement)
 */
type PropValue =
	| string
	| number
	| boolean
	| null
	| MediaStream
	| MediaSource
	| Blob
	| File
	| Element
	| Date

/**
 * Ergonomics widening applied to the emitted `Accessor<…>`:
 *
 * - General `string` → `string | number` (HTML coerces numbers)
 * - String literal unions (`'on' | 'off'`) stay exact, so users still
 *   get autocomplete / narrowing
 * - Other types pass through unchanged
 */
type WidenPropValue<V> = [V] extends [string]
	? string extends V
		? string | number
		: V
	: V

/**
 * Writable, element-specific DOM properties exposed as `prop:*`
 * attributes. Filters out: base-class keys, aria-* keys, readonly
 * keys, value types outside `PropValue`, and the generic `string`
 * index signature (e.g. `HTMLFormElement[name: string]: any`) so it
 * doesn't shadow specific keys with `Accessor<any>` ergonomics.
 */
type Properties<T> = {
	[K in keyof T as K extends keyof SkipPropsFrom
		? never
		: K extends string
			? string extends K
				? never
				: K extends `aria${string}`
					? never
					: T[K] extends PropValue
						? IsReadonlyKey<T, K> extends true
							? never
							: `prop:${K}`
						: never
			: never]?: Attribute<WidenPropValue<T[K]>>
}

/**
 * Structurally identical → `Y`; distinct → `N`. Used to detect
 * readonly keys by comparing `Pick<T, K>` with `Readonly<Pick<T,
 * K>>`.
 */
type IfEquals<A, B, Y = unknown, N = never> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? Y
		: N

/**
 * True when `K` is readonly on `T`. Singleton-constant properties
 * (e.g. `tagName: "INPUT"`, `nodeType: 1`) are always `readonly` in
 * lib.dom.d.ts, so this single check covers both readonly and
 * singleton-literal cases.
 */
type IsReadonlyKey<T, K extends keyof T> = IfEquals<
	Pick<T, K>,
	Readonly<Pick<T, K>>,
	true,
	false
>
