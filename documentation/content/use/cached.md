---
title: cached
subpath: pota/use/cached
topic: Data
desc:
  Cached fetch with in-flight dedup, Cache API persistence, and
  per-entry TTL.
---

# cached

`cached(url, opts?)` is a three-layer `fetch` wrapper: concurrent
in-flight dedup, the browser Cache API with per-entry TTL, then a real
network request. It returns a `Promise` — drop it into
[derived](/derived) and you get a Suspense-friendly reactive value
with zero retry bookkeeping.

Cache entries are stamped with an internal `x-cached-at` header, so
TTL works without a sidecar index — the Cache API itself is the source
of truth. Successful results are dropped from the in-flight map so a
later call past the TTL can refresh; failed fetches are dropped too so
they can be retried.

## Arguments

| Argument | Type            | Description                                                   |
| -------- | --------------- | ------------------------------------------------------------- |
| `url`    | `string`        | URL to fetch and key the cache by.                            |
| `opts`   | `CachedOptions` | Optional. TTL, cache bucket, and response parser — see below. |

### `CachedOptions`

| Option      | Type                       | Default           | Description                                                                          |
| ----------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `ttl`       | `number`                   | `Infinity`        | Milliseconds a Cache API entry stays fresh. After expiry the next call re-fetches.   |
| `cacheName` | `string`                   | `'pota-cache-v1'` | Cache API bucket to read/write. Bump it to isolate old entries on a breaking change. |
| `parse`     | `(r: Response) => unknown` | `r => r.json()`   | Applied to the cached or freshly-fetched `Response` to produce the resolved value.   |

**Returns:** a `Promise` resolving to the parsed value.

## How it works

Three layers are consulted in order:

1. **In-flight dedup.** Concurrent callers for the same URL share one
   `Promise`; only one request goes out.
2. **Cache API.** A matching entry within the TTL window is parsed and
   returned without touching the network. Entries carry an
   `x-cached-at` stamp, so freshness is derived from the entry itself.
3. **Network fetch.** On a miss (or expiry) the response is fetched,
   stamped, and stored. Persistence is best-effort — a failed `put` is
   swallowed — and the original response is handed to `parse`.

## Examples

### Reactive fetch with derived

Wire `cached` into [derived](/derived) so the URL drives the request.
Both layers dedup, so flipping between ids never fires the same
request twice.

```jsx
import { derived, render, signal } from 'pota'
import { cached } from 'pota/use/cached'

function App() {
	const id = signal(1)

	const post = derived(
		() => `https://jsonplaceholder.typicode.com/posts/${id.read()}`,
		url => cached(url),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<button on:click={() => id.write(1)}>reset</button>
			<h3>post #{id.read}</h3>
			<p>{() => post()?.title ?? 'loading…'}</p>
		</div>
	)
}

render(App)
```

### TTL

Within the TTL window, repeat calls come from the Cache API without
touching the network; the first call past expiry fetches once and
re-stamps the entry for everyone.

```tsx
import { render, signal } from 'pota'
import { cached } from 'pota/use/cached'

const URL = 'https://jsonplaceholder.typicode.com/posts/1'

function App() {
	const status = signal('idle')

	async function load() {
		status.write('fetching…')
		// 5s TTL — within the window, calls hit the Cache API
		const post = await cached<{ title: string }>(URL, { ttl: 5_000 })
		status.write(`got "${post.title.slice(0, 40)}…"`)
	}

	return (
		<div>
			<button on:click={load}>fetch</button>
			<p>{status.read}</p>
			<p>
				<small>
					click rapidly: subsequent calls within 5s come from the
					cache without touching the network
				</small>
			</p>
		</div>
	)
}

render(App)
```

### Non-JSON responses

Provide your own `parse` to pull text, blobs, or anything else off the
`Response`. The cache still stores the bytes; the parser only runs on
the value you receive.

```jsx
import { derived, render, signal } from 'pota'
import { cached } from 'pota/use/cached'

function App() {
	const id = signal(1)

	// override the default JSON parser to fetch a plain-text view
	const body = derived(
		() => `https://jsonplaceholder.typicode.com/posts/${id.read()}`,
		url => cached(url, { parse: r => r.text() }),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<pre style={{ 'white-space': 'pre-wrap' }}>
				{() => body() ?? 'loading…'}
			</pre>
		</div>
	)
}

render(App)
```
