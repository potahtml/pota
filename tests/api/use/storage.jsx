/** @jsxImportSource pota */
// Tests for pota/use/storage: `storage(prefix, backend?)` factory
// that returns `(key, initial?) => signal`, persisting under
// `prefix + key` and silently swallowing quota / private-mode
// failures.

import { microtask, test } from '#test'

import { root } from 'pota'
import { storage } from 'pota/use/storage'

/**
 * Build a synchronous in-memory `Storage`-shaped object so tests stay
 * hermetic — no shared state with `localStorage`, no leaks across
 * tests.
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
	const backend = memoryStore()
	await root(async dispose => {
		const store = storage('p:', backend)
		const s = store('missing', 'fallback')
		expect(s.read()).toBe('fallback')
		// initial value is persisted by the seeding effect under
		// the prefixed key
		expect(backend.getItem('p:missing')).toBe('"fallback"')
		dispose()
	})
})

await test('storage - reads existing value from store on init', async expect => {
	const backend = memoryStore()
	backend.setItem('p:hit', JSON.stringify({ foo: 1, bar: [2, 3] }))
	await root(async dispose => {
		const store = storage('p:', backend)
		const s = store('hit', { foo: 0, bar: [] })
		expect(s.read()).toEqual({ foo: 1, bar: [2, 3] })
		dispose()
	})
})

await test('storage - writes propagate into the store under the prefixed key', async expect => {
	const backend = memoryStore()
	await root(async dispose => {
		const store = storage('p:', backend)
		const s = store('w', 0)
		// Yield once so the root's initial Updates/Effects batch
		// drains; subsequent writes then flush their own batch
		// synchronously.
		await microtask()
		s.write(42)
		expect(backend.getItem('p:w')).toBe('42')
		s.write(99)
		expect(backend.getItem('p:w')).toBe('99')
		dispose()
	})
})

await test('storage - unparseable JSON falls back to initial', async expect => {
	const backend = memoryStore()
	backend.setItem('p:broken', 'not-json{{{')
	await root(async dispose => {
		const store = storage('p:', backend)
		const s = store('broken', 'safe-default')
		expect(s.read()).toBe('safe-default')
		dispose()
	})
})

await test('storage - JSON null is preserved (does not trigger fallback)', async expect => {
	// JSON.parse("null") === null; safeParse must distinguish that
	// from a missing key. Storage round-trip should round-trip null.
	const backend = memoryStore()
	backend.setItem('p:explicit-null', 'null')
	await root(async dispose => {
		const store = storage('p:', backend)
		const s = store('explicit-null', 'should-not-see-this')
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
		const store = storage('p:', angry)
		// must not throw despite the failing store
		const s = store('q', 'val')
		await microtask()
		s.write('next')
		expect(s.read()).toBe('next')
		expect(writes > 0).toBe(true)
		dispose()
	})
})

await test('storage - default localStorage path persists across calls', async expect => {
	// One key, two consecutive `store()` calls — second sees the
	// first's write. Use a per-test prefix to avoid pollution.
	const prefix = `pota-test-storage-${Math.random().toString(36).slice(2)}:`
	try {
		await root(async dispose => {
			const a = storage(prefix)('thing', 'one')
			await microtask()
			a.write('two')
			dispose()
		})
		await root(async dispose => {
			const b = storage(prefix)('thing', 'one')
			expect(b.read()).toBe('two')
			dispose()
		})
	} finally {
		localStorage.removeItem(prefix + 'thing')
	}
})

await test('storage - separate prefixes are isolated', async expect => {
	// Two namespaces over the same backend must not collide on the
	// same logical key — the prefix is the namespace boundary.
	const backend = memoryStore()
	await root(async dispose => {
		const a = storage('ns-a:', backend)
		const b = storage('ns-b:', backend)
		const sa = a('shared', 'A')
		const sb = b('shared', 'B')
		expect(sa.read()).toBe('A')
		expect(sb.read()).toBe('B')
		expect(backend.getItem('ns-a:shared')).toBe('"A"')
		expect(backend.getItem('ns-b:shared')).toBe('"B"')
		dispose()
	})
})

await test('storage - reused factory shares the prefix', async expect => {
	// One factory, multiple keys: each key gets its own signal,
	// each persisted under prefix + key.
	const backend = memoryStore()
	await root(async dispose => {
		const store = storage('app:', backend)
		const a = store('a', 1)
		const b = store('b', 2)
		await microtask()
		a.write(10)
		b.write(20)
		expect(backend.getItem('app:a')).toBe('10')
		expect(backend.getItem('app:b')).toBe('20')
		dispose()
	})
})
