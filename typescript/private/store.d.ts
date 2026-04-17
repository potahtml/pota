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
