import { cleanup, signal, syncEffect } from '../lib/reactive.js'
import { empty, window } from '../lib/std.js'

const probe = s => {
	s.setItem('_t', '_t')
	s.removeItem('_t')
}

const defaultStore = (() => {
	try {
		probe(localStorage)
		return localStorage
	} catch {}
	try {
		probe(sessionStorage)
		return sessionStorage
	} catch {}
	let o = empty()
	return {
		getItem: k => (k in o ? o[k] : null),
		setItem: (k, v) => {
			o[k] = v
		},
		removeItem: k => {
			delete o[k]
		},
	}
})()

const safeParse = raw => {
	if (raw == null) return undefined
	try {
		return JSON.parse(raw)
	} catch {
		return undefined
	}
}

/**
 * Per-key subscriber registry. Powers both same-document fan-out
 * (signals sharing a key see each other's writes) and the cross-tab
 * `storage` listener.
 *
 * @type {Map<
 * 	string,
 * 	Set<{ initial: unknown; update: (value: unknown) => void }>
 * >}
 */
const subs = new Map()

window.addEventListener('storage', e => {
	if (e.storageArea !== defaultStore) return

	// `e.key === null` is fired by `storage.clear()` in another tab —
	// revert every active key to each subscriber's own initial.
	if (e.key === null) {
		for (const set of subs.values()) {
			for (const sub of set) sub.update(sub.initial)
		}
		return
	}

	const set = subs.get(e.key)
	if (!set) return

	const parsed = safeParse(e.newValue)
	for (const sub of set) {
		sub.update(parsed === undefined ? sub.initial : parsed)
	}
})

/**
 * Builds a storage namespace bound to `prefix`. Every signal the
 * returned factory creates persists under `prefix + key` in the
 * default storage area: `localStorage`, falling back to
 * `sessionStorage`, then to an in-memory shim.
 *
 * ```js
 * const store = storage('my-app:')
 * const dark = store('dark', false)
 * dark.read()
 * dark.write(true)
 * dark.update(v => !v)
 * ```
 *
 * Each call returns a `signal()`-shaped object: an iterable `[read,
 * write, update]` tuple that also exposes `.read`, `.write`,
 * `.update` as properties. The initial value comes from storage when
 * present, falling back to `initial`. Signals for the same key stay
 * in sync within the same document, and browser-backed stores also
 * react to `storage` events from other tabs. Storage writes are
 * wrapped in try/catch so quota and private-mode failures are
 * silently ignored — the signal still behaves correctly in-memory.
 *
 * @param {string} prefix Prefix prepended to every key (caller picks
 *   the separator, e.g. `'my-app:'` or `'my-app/'`).
 * @url https://pota.quack.uy/use/storage
 */
export function storage(prefix) {
	/**
	 * @template T
	 * @param {string} key
	 * @param {T} [initial]
	 * @returns {SignalObject<T>}
	 */
	return (key, initial) => {
		const fullKey = prefix + key
		const parsed = safeParse(defaultStore.getItem(fullKey))
		const s = /** @type {SignalObject<T>} */ (
			signal(parsed === undefined ? initial : parsed)
		)
		let skipNextPersist = false

		const me = {
			initial,
			update(value) {
				if (Object.is(s.read(), value)) return
				skipNextPersist = true
				s.write(/** @type {T} */ (value))
			},
		}

		let set = subs.get(fullKey)
		if (!set) subs.set(fullKey, (set = new Set()))
		set.add(me)
		cleanup(() => {
			set.delete(me)
			if (!set.size) subs.delete(fullKey)
		})

		// syncEffect (not effect) so writes hit the store immediately —
		// callers expect a storage signal to be persisted by the time
		// `write()` returns, not on the next microtask.
		syncEffect(() => {
			const value = s.read()
			if (skipNextPersist) {
				skipNextPersist = false
				return
			}
			// prevents QuotaExceeded crash
			try {
				defaultStore.setItem(fullKey, JSON.stringify(value))
			} catch {}
			for (const sub of set) {
				if (sub !== me) sub.update(value)
			}
		})

		return s
	}
}
