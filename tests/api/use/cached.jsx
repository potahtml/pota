/** @jsxImportSource pota */
// Tests for pota/use/cached: in-flight dedup, Cache API persistence,
// per-entry TTL via the `x-cached-at` header, and the `parse` option.

import { test, sleep } from '#test'

import { cached } from 'pota/use/cached'

/**
 * Per-test URL prefix so the in-flight Map and Cache API entries
 * stay hermetic across tests (the module-level inflight Map is
 * shared, and Cache API entries survive page lifetimes).
 */
const uniqueUrl = name =>
	`https://pota-test.invalid/cached/${name}-${Math.random().toString(36).slice(2)}`

/** Use a per-test cacheName so a stray entry from one test cannot
 *  satisfy another. */
const uniqueCacheName = () =>
	`pota-test-cache-${Math.random().toString(36).slice(2)}`

/**
 * Replace `globalThis.fetch` with a counting mock for the duration
 * of `fn`. Returns the call count after the fn finishes.
 */
async function withFetch(handler, fn) {
	const original = globalThis.fetch
	let calls = 0
	globalThis.fetch = async (...args) => {
		calls++
		return handler(...args)
	}
	try {
		await fn(() => calls)
	} finally {
		globalThis.fetch = original
	}
}

const jsonResponse = (body, init = {}) =>
	new Response(JSON.stringify(body), {
		headers: { 'content-type': 'application/json' },
		...init,
	})

await test('cached - first call fetches and persists into the Cache API', async expect => {
	const url = uniqueUrl('first')
	const cacheName = uniqueCacheName()
	try {
		await withFetch(
			async () => jsonResponse({ hello: 'world' }),
			async getCalls => {
				const v = await cached(url, { cacheName })
				expect(v).toEqual({ hello: 'world' })
				expect(getCalls()).toBe(1)

				const store = await caches.open(cacheName)
				const hit = await store.match(url)
				expect(!!hit).toBe(true)
				expect(/^\d+$/.test(hit.headers.get('x-cached-at'))).toBe(
					true,
				)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - concurrent calls for the same URL share one fetch', async expect => {
	const url = uniqueUrl('inflight')
	const cacheName = uniqueCacheName()
	try {
		await withFetch(
			// resolve slowly so the second/third callers land while the
			// first is still in flight
			async () => {
				await sleep(20)
				return jsonResponse({ n: 1 })
			},
			async getCalls => {
				const [a, b, c] = await Promise.all([
					cached(url, { cacheName }),
					cached(url, { cacheName }),
					cached(url, { cacheName }),
				])
				expect(a).toEqual({ n: 1 })
				expect(b).toEqual({ n: 1 })
				expect(c).toEqual({ n: 1 })
				// in-flight dedup: only ONE actual fetch
				expect(getCalls()).toBe(1)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - within TTL, second call serves from Cache API (no fetch)', async expect => {
	const url = uniqueUrl('ttl-hit')
	const cacheName = uniqueCacheName()
	try {
		await withFetch(
			async () => jsonResponse({ payload: 'one' }),
			async getCalls => {
				const first = await cached(url, { cacheName, ttl: 60_000 })
				expect(first).toEqual({ payload: 'one' })

				// second call within TTL must NOT call fetch
				const second = await cached(url, { cacheName, ttl: 60_000 })
				expect(second).toEqual({ payload: 'one' })
				expect(getCalls()).toBe(1)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - past TTL triggers a refresh fetch', async expect => {
	const url = uniqueUrl('ttl-miss')
	const cacheName = uniqueCacheName()
	try {
		let body = 'one'
		await withFetch(
			async () => jsonResponse({ payload: body }),
			async getCalls => {
				const first = await cached(url, { cacheName, ttl: 5 })
				expect(first).toEqual({ payload: 'one' })

				await sleep(20)
				body = 'two'

				const second = await cached(url, { cacheName, ttl: 5 })
				expect(second).toEqual({ payload: 'two' })
				expect(getCalls()).toBe(2)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - custom `parse` runs on both fresh and cached responses', async expect => {
	const url = uniqueUrl('parse')
	const cacheName = uniqueCacheName()
	try {
		await withFetch(
			async () => new Response('PLAIN-TEXT'),
			async () => {
				const first = await cached(url, {
					cacheName,
					parse: r => r.text(),
				})
				expect(first).toBe('PLAIN-TEXT')

				const second = await cached(url, {
					cacheName,
					parse: r => r.text(),
				})
				expect(second).toBe('PLAIN-TEXT')
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - rejected fetch is dropped from the in-flight map (retry works)', async expect => {
	const url = uniqueUrl('retry')
	const cacheName = uniqueCacheName()
	try {
		let phase = 'fail'
		await withFetch(
			async () => {
				if (phase === 'fail') throw new Error('network down')
				return jsonResponse({ ok: true })
			},
			async getCalls => {
				/** @type {unknown} */
				let caught
				try {
					await cached(url, { cacheName })
				} catch (e) {
					caught = e
				}
				expect(/** @type {Error} */ (caught)?.message).toBe(
					'network down',
				)

				phase = 'ok'
				const retried = await cached(url, { cacheName })
				expect(retried).toEqual({ ok: true })
				// two real network calls: the failed one and the retry
				expect(getCalls()).toBe(2)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

await test('cached - default TTL is Infinity (Cache API hit forever in-process)', async expect => {
	const url = uniqueUrl('default-ttl')
	const cacheName = uniqueCacheName()
	try {
		await withFetch(
			async () => jsonResponse({ v: 1 }),
			async getCalls => {
				await cached(url, { cacheName })
				// Even after a "long" wait, default TTL keeps it fresh
				await sleep(20)
				await cached(url, { cacheName })
				expect(getCalls()).toBe(1)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})
