import { signal, syncEffect } from '../lib/reactive.js'
import { empty } from '../lib/std.js'

let defaultStore

function probe(s) {
	const t = '_t'
	s.setItem(t, t)
	s.getItem(t)
	s.removeItem(t)
}

try {
	defaultStore = localStorage
	probe(defaultStore)
} catch {
	try {
		defaultStore = sessionStorage
		probe(defaultStore)
	} catch {
		let o = empty()
		defaultStore = {
			setItem: (k, v) => (o[k] = v),
			getItem: k => o[k],
			removeItem: k => delete o[k],
			clear: () => (o = empty()),
		}
	}
}

/**
 * @param {string | null} raw
 * @returns {unknown}
 */
const safeParse = raw => {
	if (raw == null) return undefined
	try {
		return JSON.parse(raw)
	} catch {
		return undefined
	}
}

/**
 * Builds a storage namespace bound to `prefix`. Every signal the
 * returned factory creates persists under `prefix + key` in the
 * chosen backend (default `localStorage`, with `sessionStorage` then
 * an in-memory shim as fallbacks).
 *
 * ```js
 * const store = storage('my-app:')
 * const dark = store('dark', false)
 * dark.read()
 * dark.write(true)
 * dark.update(v => !v)
 * ```
 *
 * Each call returns a `signal()`-shaped object: an iterable
 * `[read, write, update]` tuple that also exposes `.read`, `.write`,
 * `.update` as properties. The initial value comes from storage when
 * present, falling back to `initial`. Storage writes are wrapped in
 * try/catch so quota and private-mode failures are silently ignored
 * — the signal still behaves correctly in-memory.
 *
 * @param {string} prefix Prefix prepended to every key (caller picks
 *   the separator, e.g. `'my-app:'` or `'my-app/'`).
 * @param {Storage} [backend] Storage backend; defaults to
 *   `localStorage` (falling back to `sessionStorage` or an in-memory
 *   shim when unavailable).
 * @url https://pota.quack.uy/use/storage
 */
export function storage(prefix, backend = defaultStore) {
	/**
	 * @template T
	 * @param {string} key
	 * @param {T} [initial]
	 * @returns {SignalObject<T>}
	 */
	const create = (key, initial = undefined) => {
		const fullKey = prefix + key
		const stored = safeParse(backend.getItem(fullKey))
		const s = /** @type {SignalObject<T>} */ (
			signal(stored === undefined ? initial : stored)
		)

		// syncEffect (not effect) so writes hit the store immediately —
		// callers expect a storage signal to be persisted by the time
		// `write()` returns, not on the next microtask.
		syncEffect(() => {
			// prevents QuotaExceeded crash
			try {
				backend.setItem(fullKey, JSON.stringify(s.read()))
			} catch {}
		})

		return s
	}
	return create
}
