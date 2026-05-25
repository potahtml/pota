/** @jsxImportSource pota */
// Tests for pota/use/storage: signal whose value is mirrored to a
// Web Storage area on every write, with try/catch silent error
// handling for quota / private-mode failures.

import { microtask, test } from '#test'

import { root } from 'pota'
import { storage } from 'pota/use/storage'

/**
 * Build a synchronous in-memory `Storage`-shaped object so tests
 * stay hermetic — no shared state with `localStorage`, no leaks
 * across tests.
 */
function memoryStore() {
	const map = new Map()
	return {
		get length() {
			return map.size
		},
		key: i => [...map.keys()][i] ?? null,
		getItem: k => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => {
			map.set(k, String(v))
		},
		removeItem: k => {
			map.delete(k)
		},
		clear: () => map.clear(),
	}
}

await test('storage - falls back to initial when store is empty', async expect => {
	const store = memoryStore()
	await root(async dispose => {
		const s = storage('missing', 'fallback', store)
		expect(s.read()).toBe('fallback')
		// initial value is persisted by the seeding effect
		expect(store.getItem('missing')).toBe('"fallback"')
		dispose()
	})
})

await test('storage - reads existing value from store on init', async expect => {
	const store = memoryStore()
	store.setItem('hit', JSON.stringify({ foo: 1, bar: [2, 3] }))
	await root(async dispose => {
		const s = storage('hit', { foo: 0, bar: [] }, store)
		expect(s.read()).toEqual({ foo: 1, bar: [2, 3] })
		dispose()
	})
})

await test('storage - writes propagate into the store', async expect => {
	const store = memoryStore()
	await root(async dispose => {
		const s = storage('w', 0, store)
		// Yield once so the root's initial Updates/Effects batch
		// drains; subsequent writes then flush their own batch
		// synchronously.
		await microtask()
		s.write(42)
		expect(store.getItem('w')).toBe('42')
		s.write(99)
		expect(store.getItem('w')).toBe('99')
		dispose()
	})
})

await test('storage - unparseable JSON falls back to initial', async expect => {
	const store = memoryStore()
	store.setItem('broken', 'not-json{{{')
	await root(async dispose => {
		const s = storage('broken', 'safe-default', store)
		expect(s.read()).toBe('safe-default')
		dispose()
	})
})

await test('storage - JSON null is preserved (does not trigger fallback)', async expect => {
	// JSON.parse("null") === null; safeParse must distinguish that
	// from a missing key. Storage round-trip should round-trip null.
	const store = memoryStore()
	store.setItem('explicit-null', 'null')
	await root(async dispose => {
		const s = storage('explicit-null', 'should-not-see-this', store)
		expect(s.read()).toBe(null)
		dispose()
	})
})

await test('storage - setItem failures are swallowed silently', async expect => {
	// Simulate a quota / private-mode store that throws on write.
	let writes = 0
	const angry = {
		getItem: () => null,
		setItem: () => {
			writes++
			throw new Error('QuotaExceeded')
		},
		removeItem: () => {},
		clear: () => {},
		key: () => null,
		length: 0,
	}
	await root(async dispose => {
		// must not throw despite the failing store
		const s = storage('q', 'val', angry)
		await microtask()
		s.write('next')
		expect(s.read()).toBe('next')
		expect(writes > 0).toBe(true)
		dispose()
	})
})

await test('storage - default localStorage path persists across calls', async expect => {
	// One key, two consecutive `storage()` calls — second sees the
	// first's write. Use a per-test prefix to avoid pollution.
	const key = `pota-test-storage-${Math.random().toString(36).slice(2)}`
	try {
		await root(async dispose => {
			const a = storage(key, 'one')
			await microtask()
			a.write('two')
			dispose()
		})
		await root(async dispose => {
			const b = storage(key, 'one')
			expect(b.read()).toBe('two')
			dispose()
		})
	} finally {
		localStorage.removeItem(key)
	}
})
