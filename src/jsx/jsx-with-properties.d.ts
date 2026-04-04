/**
 * Distinct types → `N`; structurally the same → `Y` (used to detect
 * readonly props).
 */
type IfEquals<A, B, Y = unknown, N = never> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? Y
		: N

type UnionToIntersection<U> = (
	U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never

/** True when `T` is a union of two or more distinct types. */
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true

/** `string` / `number` / `boolean` (not a literal or literal union). */
type IsWidePrimitive<T> = [T] extends [string]
	? string extends T
		? true
		: false
	: [T] extends [number]
		? number extends T
			? true
			: false
		: [T] extends [boolean]
			? boolean extends T
				? true
				: false
			: false

/**
 * Single compile-time constant (e.g. `tagName: "INPUT"`, `nodeType:
 * 1`). Omit from `prop:*`; unions of literals (e.g. `type` on
 * `<input>`) are kept.
 */
type IsSingletonLiteral<T> =
	IsUnion<T> extends true
		? false
		: IsWidePrimitive<T> extends true
			? false
			: [T] extends [string | number | boolean | bigint | symbol]
				? true
				: false

/**
 * True when `K` is readonly on `T` (e.g. `childElementCount` from
 * `ParentNode`). Single-key `{ [Q in K]: T[K] }` does **not** copy
 * `readonly`, so we compare `Pick` to `Readonly<Pick>` instead of the
 * old `IfEquals` mapped pair.
 */
type IsReadonlyKey<T, K extends keyof T> = IfEquals<
	Pick<T, K>,
	Readonly<Pick<T, K>>,
	true,
	false
>

type SkipPropsFrom = HTMLUnknownElement & HTMLElement & Element & Node

/**
 * DOM readonly and singleton-constant props are not useful as
 * `prop:*`.
 */
type Properties<T> = {
	[K in keyof T as K extends keyof SkipPropsFrom
		? never
		: K extends string
			? K extends `aria${string}`
				? never
				: T[K] extends string | number | boolean | null
					? IsReadonlyKey<T, K> extends true
						? never
						: IfEquals<
								IsSingletonLiteral<T[K]>,
								true,
								never,
								`prop:${K}`
							>
					: never
			: never]?: Accessor<T[K]>
}

export type WithProperties<
	I extends object,
	TagNameMap,
	DefaultInterface,
> = {
	[K in keyof I]: I[K] &
		Properties<
			K extends keyof TagNameMap ? TagNameMap[K] : DefaultInterface
		>
}
