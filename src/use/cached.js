/**
 * In-flight dedup: concurrent callers for the same URL share one
 * Promise.
 */
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map()

const STAMP = 'x-cached-at'

/**
 * @typedef {object} CachedOptions
 * @property {number} [ttl=Infinity] Milliseconds a Cache-API entry is
 *   considered fresh. After expiry the next call re-fetches. Default
 *   is `Infinity`
 * @property {string} [cacheName='pota-cache-v1'] The Cache API bucket
 *   to read/write. Default is `'pota-cache-v1'`
 * @property {(r: Response) => unknown} [parse] Default is `r =>
 *   r.json()`. Applied to the cached or freshly-fetched `Response` to
 *   produce the resolved value.
 */

/**
 * Cached `fetch`. Three layers: concurrent in-flight dedup, Cache API
 * persistence with per-entry TTL, then network fetch. Cache entries
 * are stamped with `x-cached-at` so TTL works without a sidecar
 * index. Successful results are removed from the in-flight map so
 * later calls (past TTL) can refresh; failed fetches are removed too
 * so they can be retried.
 *
 * @template T
 * @param {string} url
 * @param {CachedOptions} [opts]
 * @returns {Promise<T>}
 * @url https://pota.quack.uy/use/cached
 */
export function cached(url, opts) {
	const existing = inflight.get(url)
	if (existing) return /** @type {Promise<T>} */ (existing)

	const ttl = opts?.ttl ?? Infinity
	const cacheName = opts?.cacheName ?? 'pota-cache-v1'
	const parse = opts?.parse ?? (r => r.json())

	const p = (async () => {
		const store = await caches.open(cacheName)
		const hit = await store.match(url)
		if (hit) {
			const at = Number(hit.headers.get(STAMP) || 0)
			if (Date.now() - at < ttl) return parse(hit)
		}
		const res = await fetch(url)
		// Clone the body before consuming so we can both stamp+store
		// and hand the original response to `parse`.
		const buf = await res.clone().arrayBuffer()
		const stamped = new Response(buf, {
			headers: {
				'content-type':
					res.headers.get('content-type') ||
					'application/octet-stream',
				[STAMP]: String(Date.now()),
			},
		})
		// Await the put so a subsequent `cached(url)` after this
		// promise resolves sees the entry in the Cache API. Errors
		// are swallowed — persistence is best-effort, but we don't
		// want races where a same-tick repeat call misses the cache.
		try {
			await store.put(url, stamped)
		} catch {}
		return parse(res)
	})().finally(() => inflight.delete(url))

	inflight.set(url, p)
	return /** @type {Promise<T>} */ (p)
}
