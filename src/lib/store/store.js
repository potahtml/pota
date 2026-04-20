import { batch, untrack } from '../reactive.js'
import { mutable } from './mutable.js'

/**
 * Creates a reactive store with a dedicated batched setter.
 *
 * Returns a `[store, setStore]` tuple:
 *
 * - `store` is a mutable proxy, typed as `DeepReadonly<T>` so the
 *   only sanctioned way to mutate it is through `setStore`.
 *   Runtime does not enforce the readonly tag — direct writes
 *   would succeed but TypeScript rejects them.
 * - `setStore(fn)` runs `fn(draft)` inside `batch()`, so any
 *   number of writes in one call flush to effects once.
 *
 * ```js
 * const [user, setUser] = store({ name: 'ada', age: 0 })
 *
 * setUser(u => {
 * 	u.name = 'grace'
 * 	u.age = 30 // single batched flush
 * })
 * ```
 *
 * @template {object} T
 * @param {T} source
 * @param {boolean} [clone] - If `true`, `source` is deep-copied
 *   first so outside references to `source` cannot bypass
 *   `setStore`.
 * @returns {import('#type/store.d.ts').StoreTuple<T>}
 */
export function store(source, clone) {
	const draft = mutable(source, clone)
	// `untrack` so reads inside the mutator never subscribe the
	// outer reactive context — setStore is a write-only side
	// effect. In particular, reading and writing the same key
	// inside the mutator (`d.a = d.a + 1`) can't self-feedback
	// when invoked from within a memo/effect.
	const setStore = fn => {
		batch(() => untrack(() => fn(draft)))
	}
	return /** @type {import('#type/store.d.ts').StoreTuple<T>} */ ([
		draft,
		setStore,
	])
}
