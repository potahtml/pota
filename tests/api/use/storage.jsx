/** @jsxImportSource pota */
// Tests for pota/use/storage: `storage(prefix)` factory returning
// `(key, initial?) => signal`, persisting under `prefix + key`,
// syncing same-document instances and cross-tab `storage` events,
// and swallowing storage write failures.

import { microtask, test } from '#test'

import { root } from 'pota'
import { storage } from 'pota/use/storage'

const nativeStore = (() => {
	const probeKey = `pota-test-storage-probe-${Math.random().toString(36).slice(2)}`

	try {
		localStorage.setItem(probeKey, probeKey)
		localStorage.removeItem(probeKey)
		return localStorage
	} catch {}

	try {
		sessionStorage.setItem(probeKey, probeKey)
		sessionStorage.removeItem(probeKey)
		return sessionStorage
	} catch {}

	throw new Error(
		'storage tests require localStorage or sessionStorage',
	)
})()

const cleanupKeys = (...keys) => {
	for (const key of keys) nativeStore.removeItem(key)
}

await test('storage - falls back to initial when store is empty', async expect => {
	const fullKey = `pota-test-storage-missing-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', 'fallback')
			expect(s.read()).toBe('fallback')
			expect(nativeStore.getItem(prefix + 'value')).toBe('"fallback"')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - reads existing value from storage on init', async expect => {
	const fullKey = `pota-test-storage-hit-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		nativeStore.setItem(
			prefix + 'value',
			JSON.stringify({ foo: 1, bar: [2, 3] }),
		)
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', { foo: 0, bar: [] })
			expect(s.read()).toEqual({ foo: 1, bar: [2, 3] })
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - writes propagate into storage under the prefixed key', async expect => {
	const fullKey = `pota-test-storage-write-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', 0)
			await microtask()
			s.write(42)
			expect(nativeStore.getItem(prefix + 'value')).toBe('42')
			s.write(99)
			expect(nativeStore.getItem(prefix + 'value')).toBe('99')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - signals sharing a key stay in sync in the same document', async expect => {
	const fullKey = `pota-test-storage-shared-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const a = store('value', 0)
			const b = store('value', 0)
			await microtask()
			a.write(42)
			expect(b.read()).toBe(42)
			b.write(7)
			expect(a.read()).toBe(7)
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - unparseable JSON falls back to initial', async expect => {
	const fullKey = `pota-test-storage-broken-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		nativeStore.setItem(prefix + 'value', 'not-json{{{')
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', 'safe-default')
			expect(s.read()).toBe('safe-default')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - JSON null is preserved (does not trigger fallback)', async expect => {
	const fullKey = `pota-test-storage-null-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		nativeStore.setItem(prefix + 'value', 'null')
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', 'should-not-see-this')
			expect(s.read()).toBe(null)
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - setItem failures are swallowed silently', async expect => {
	const fullKey = `pota-test-storage-angry-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	const storageProto = Object.getPrototypeOf(nativeStore)
	const originalSetItem = storageProto.setItem
	let writes = 0

	storageProto.setItem = function () {
		writes++
		throw new Error('QuotaExceeded')
	}

	try {
		await root(async dispose => {
			const store = storage(prefix)
			const s = store('value', 'val')
			await microtask()
			s.write('next')
			expect(s.read()).toBe('next')
			expect(writes > 0).toBe(true)
			dispose()
		})
	} finally {
		storageProto.setItem = originalSetItem
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - default storage path persists across calls', async expect => {
	const fullKey = `pota-test-storage-persist-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const a = storage(prefix)('value', 'one')
			await microtask()
			a.write('two')
			dispose()
		})
		await root(async dispose => {
			const b = storage(prefix)('value', 'one')
			expect(b.read()).toBe('two')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - storage events from another tab update the local signal', async expect => {
	const fullKey = `pota-test-storage-sync-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const s = storage(prefix)('value', 'one')
			await microtask()
			expect(s.read()).toBe('one')

			window.dispatchEvent(
				new StorageEvent('storage', {
					key: prefix + 'value',
					newValue: JSON.stringify('two'),
					oldValue: JSON.stringify('one'),
					storageArea: nativeStore,
				}),
			)

			expect(s.read()).toBe('two')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - external removeItem reverts each signal to its own initial', async expect => {
	const fullKey = `pota-test-storage-remove-event-${Math.random().toString(36).slice(2)}`
	const prefix = fullKey + ':'
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const a = store('value', 'first')
			const b = store('value', 'second')
			await microtask()
			a.write('changed')

			window.dispatchEvent(
				new StorageEvent('storage', {
					key: prefix + 'value',
					newValue: null,
					oldValue: JSON.stringify('changed'),
					storageArea: nativeStore,
				}),
			)

			expect(a.read()).toBe('first')
			expect(b.read()).toBe('second')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'value')
	}
})

await test('storage - external clear resets every active key to its initial', async expect => {
	const prefix = `pota-test-storage-clear-event-${Math.random().toString(36).slice(2)}:`
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const a = store('a', 'A')
			const b = store('b', 'B')
			await microtask()
			a.write('AA')
			b.write('BB')

			window.dispatchEvent(
				new StorageEvent('storage', {
					key: null,
					newValue: null,
					oldValue: null,
					storageArea: nativeStore,
				}),
			)

			expect(a.read()).toBe('A')
			expect(b.read()).toBe('B')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'a', prefix + 'b')
	}
})

await test('storage - separate prefixes are isolated', async expect => {
	const prefixA = `pota-test-storage-a-${Math.random().toString(36).slice(2)}:`
	const prefixB = `pota-test-storage-b-${Math.random().toString(36).slice(2)}:`
	try {
		await root(async dispose => {
			const a = storage(prefixA)
			const b = storage(prefixB)
			const sa = a('shared', 'A')
			const sb = b('shared', 'B')
			expect(sa.read()).toBe('A')
			expect(sb.read()).toBe('B')
			expect(nativeStore.getItem(prefixA + 'shared')).toBe('"A"')
			expect(nativeStore.getItem(prefixB + 'shared')).toBe('"B"')
			dispose()
		})
	} finally {
		cleanupKeys(prefixA + 'shared', prefixB + 'shared')
	}
})

await test('storage - reused factory shares the prefix', async expect => {
	const prefix = `pota-test-storage-app-${Math.random().toString(36).slice(2)}:`
	try {
		await root(async dispose => {
			const store = storage(prefix)
			const a = store('a', 1)
			const b = store('b', 2)
			await microtask()
			a.write(10)
			b.write(20)
			expect(nativeStore.getItem(prefix + 'a')).toBe('10')
			expect(nativeStore.getItem(prefix + 'b')).toBe('20')
			dispose()
		})
	} finally {
		cleanupKeys(prefix + 'a', prefix + 'b')
	}
})
