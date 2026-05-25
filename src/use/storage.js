import { signal, syncEffect } from '../lib/reactive.js'
import { empty } from '../lib/std.js'

let store

function test() {
	const t = '_t'
	store.setItem(t, t)
	store.getItem(t)
	store.removeItem(t)
}

try {
	store = localStorage
	test()
} catch (e) {
	try {
		store = sessionStorage
		test()
	} catch (e) {
		let o = empty()
		store = {
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
 * Signal whose value is persisted to a Web Storage area under `key`.
 * The initial value is read from storage when present, falling back
 * to `initial`.
 *
 * Every write to the signal is mirrored into storage via
 * JSON-serialization. Storage writes are wrapped in try/catch — quota
 * errors and private-mode failures are silently ignored so the signal
 * still behaves correctly in-memory.
 *
 * The returned object has the same shape as a `signal()`: an iterable
 * `[read, write, update]` tuple that also exposes `.read`, `.write`,
 * `.update` as properties.
 *
 * @template T
 * @param {string} key
 * @param {T} initial
 * @param {Storage} [backend] Storage backend; defaults to
 *   `localStorage` (falling back to `sessionStorage` or an in-memory
 *   shim when unavailable).
 * @returns {SignalObject<T>}
 * @url https://pota.quack.uy/use/storage
 */
export function storage(key, initial = undefined, backend = store) {
	const stored = safeParse(backend.getItem(key))
	const s = /** @type {SignalObject<T>} */ (
		signal(stored === undefined ? initial : stored)
	)

	// syncEffect (not effect) so writes hit the store immediately —
	// callers expect a `storage` signal to be persisted by the time
	// `write()` returns, not on the next microtask.
	syncEffect(() => {
		// prevents QuotaExceeded crash
		try {
			backend.setItem(key, JSON.stringify(s.read()))
		} catch {}
	})

	return s
}
