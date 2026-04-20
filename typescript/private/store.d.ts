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
 * Return type of `mutable()` / `signalify()`. Arrays become writable
 * arrays; objects are readonly-stripped so a frozen-input `T` still
 * types as assignable; Map/Set keep their class types. All variants
 * add `Record<PropertyKey, any>` — mutable proxies support dynamic
 * string **and symbol** keys at runtime, including on Map/Set
 * instances (the proxy uses `ProxyHandlerObject`-based trapping so
 * `map.customProp = 'x'` is reactive).
 */
export type Mutable<T> = T extends Map<any, any> | Set<any>
	? T & Record<PropertyKey, any>
	: T extends ReadonlyArray<infer U>
		? U[] & Record<PropertyKey, any>
		: {
				-readonly [K in keyof T]: T[K]
			} & Record<PropertyKey, any>

/**
 * Deep-readonly view of `T`. Recurses through arrays, Maps, Sets, and
 * plain objects; leaves primitives, functions, and built-ins alone.
 * Used to tag a `store`'s first tuple element so direct writes are
 * rejected at the type level.
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
 * Deep-mutable counterpart of `DeepReadonly<T>` — strips `readonly`
 * through arrays, Maps, Sets, and plain objects. Used for the
 * setter's draft argument so a frozen/readonly input can still be
 * mutated inside `setStore`.
 */
export type DeepMutable<T> = T extends (...args: any[]) => any
	? T
	: T extends ReadonlyArray<infer U>
		? DeepMutable<U>[]
		: T extends ReadonlyMap<infer K, infer V>
			? Map<DeepMutable<K>, DeepMutable<V>>
			: T extends ReadonlySet<infer V>
				? Set<DeepMutable<V>>
				: T extends object
					? { -readonly [K in keyof T]: DeepMutable<T[K]> }
					: T

/**
 * Return type of `store(source)`: a `[DeepReadonly<T>, setStore]`
 * tuple. `setStore` receives a mutator that sees the writable draft
 * and runs inside `batch()`.
 */
export type StoreTuple<T> = readonly [
	DeepReadonly<T>,
	(mutator: (draft: DeepMutable<T>) => void) => void,
]
