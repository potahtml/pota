/** @jsxImportSource pota */
// Coverage tests for pota/use/cached targeting otherwise-uncovered
// branches in src/use/cached.js:
//   - L41: `opts?.cacheName ?? 'pota-cache-v1'` default-cacheName branch
//          (call cached() without a cacheName option)
//   - L48: `Number(hit.headers.get(STAMP) || 0)` fallback when a cache
//          entry carries no `x-cached-at` stamp (pre-seeded entry)
//   - L69: `catch {}` swallowing a failing `store.put`

import { test } from '#test'

import { cached } from 'pota/use/cached'

const uniqueUrl = name =>
	`https://pota-test.invalid/cached-cov/${name}-${Math.random().toString(36).slice(2)}`

const uniqueCacheName = () =>
	`pota-test-cache-cov-${Math.random().toString(36).slice(2)}`

/**
 * Replace `globalThis.fetch` with a counting mock for the duration of
 * `fn`; passes a `getCalls()` accessor.
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

const jsonResponse = body =>
	new Response(JSON.stringify(body), {
		headers: { 'content-type': 'application/json' },
	})

// L41: omit `cacheName` so the `?? 'pota-cache-v1'` default branch
// runs. Verify the entry landed in the default bucket, then clean it
// up so the harness's cache cleanliness check stays happy.
await test('cached - default cacheName falls back to pota-cache-v1', async expect => {
	const url = uniqueUrl('default-cache-name')
	try {
		await withFetch(
			async () => jsonResponse({ via: 'default-bucket' }),
			async getCalls => {
				const v = await cached(url)
				expect(v).toEqual({ via: 'default-bucket' })
				expect(getCalls()).toBe(1)

				// The default bucket is 'pota-cache-v1'.
				const store = await caches.open('pota-cache-v1')
				const hit = await store.match(url)
				expect(!!hit).toBe(true)
			},
		)
	} finally {
		// Remove only the single entry we added; never nuke the whole
		// default bucket (it is shared, and may be used elsewhere).
		const store = await caches.open('pota-cache-v1')
		await store.delete(url)
	}
})

// L48: a Cache API hit that has NO `x-cached-at` header. cached()
// always stamps its own writes, so we pre-seed the bucket directly
// with an un-stamped Response. `Number(null || 0)` => at = 0, and with
// ttl=Infinity (default) `Date.now() - 0 < Infinity` is true, so the
// cached value is served WITHOUT any fetch.
await test('cached - unstamped cache hit uses the 0 fallback stamp', async expect => {
	const url = uniqueUrl('unstamped')
	const cacheName = uniqueCacheName()
	try {
		const store = await caches.open(cacheName)
		// No `x-cached-at` header on this entry.
		await store.put(
			url,
			new Response(JSON.stringify({ seeded: true }), {
				headers: { 'content-type': 'application/json' },
			}),
		)
		const hit = await store.match(url)
		expect(!!hit).toBe(true)

		await withFetch(
			async () => jsonResponse({ seeded: false }),
			async getCalls => {
				// Default ttl is Infinity; at=0 means the entry is fresh,
				// so the seeded (unstamped) value is served and fetch is
				// never called.
				const v = await cached(url, { cacheName })
				expect(v).toEqual({ seeded: true })
				expect(getCalls()).toBe(0)
			},
		)
	} finally {
		await caches.delete(cacheName)
	}
})

// L69: `store.put` rejects -> the `catch {}` swallows it and `parse`
// still resolves the freshly-fetched value. Monkey-patch caches.open
// to hand back a store whose `put` always throws.
await test('cached - a failing store.put is swallowed and parse still resolves', async expect => {
	const url = uniqueUrl('put-fails')
	const cacheName = uniqueCacheName()
	const originalOpen = caches.open
	try {
		caches.open = async name => {
			const real = await originalOpen.call(caches, name)
			return /** @type {Cache} */ ({
				match: (...a) => real.match(...a),
				add: request => real.add(request),
				addAll: requests => real.addAll(requests),
				put: async () => {
					throw new Error('quota exceeded')
				},
				delete: request => real.delete(request),
				keys: () => real.keys(),
				matchAll: (...a) => real.matchAll(...a),
			})
		}

		await withFetch(
			async () => jsonResponse({ persisted: false }),
			async getCalls => {
				// store.put throws, but the catch {} swallows it and the
				// network value is still returned.
				const v = await cached(url, { cacheName })
				expect(v).toEqual({ persisted: false })
				expect(getCalls()).toBe(1)
			},
		)
	} finally {
		caches.open = originalOpen
		await caches.delete(cacheName)
	}
})
