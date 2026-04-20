/**
 * Recursive shape for the `keys` option of `merge` / `replace`.
 * Mirrors the shape of the `source` argument (reconcile iterates
 * source): at each object level the keys match source's property
 * names; at an array the leaf is `{ key: string }` naming the id
 * field of the array's element, optionally with nested options for
 * that element.
 */
export type KeysOption<T> =
	T extends ReadonlyArray<infer U>
		? U extends object
			? { key: Extract<keyof U, string> } & {
					[K in keyof U]?: KeysOption<U[K]>
				}
			: never
		: T extends object
			? { [K in keyof T]?: KeysOption<T[K]> }
			: never

/**
 * Deep-readonly view of `T`. Recurses through arrays, Maps, Sets,
 * and plain objects; leaves primitives, functions, and built-ins
 * alone. Used to tag a `store`'s first tuple element so direct
 * writes are rejected at the type level.
 */
export type DeepReadonly<T> = T extends (...args: any[]) => any
	? T
	: T extends ReadonlyArray<infer U>
		? ReadonlyArray<DeepReadonly<U>>
		: T extends ReadonlyMap<infer K, infer V>
			? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
			: T extends ReadonlySet<infer V>
				? ReadonlySet<DeepReadonly<V>>
				: T extends object
					? { readonly [K in keyof T]: DeepReadonly<T[K]> }
					: T

/**
 * Return type of `store(source)`: a `[DeepReadonly<T>, setStore]`
 * tuple. `setStore` receives a mutator that sees the writable
 * draft and runs inside `batch()`.
 */
export type StoreTuple<T> = readonly [
	DeepReadonly<T>,
	(mutator: (draft: T) => void) => void,
]
