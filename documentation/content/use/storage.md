---
title: storage
subpath: pota/use/storage
topic: Data
desc:
  Namespaced signal factory that persists each signal under prefix +
  key in localStorage.
---

# storage

`storage(prefix)` builds a namespaced signal factory. Every signal it
produces persists under `prefix + key` in `localStorage` — falling
back to `sessionStorage`, and then to an in-memory shim when both are
unavailable (private mode, sandboxed iframes, etc.). The caller picks
the separator: `'my-app:'`, `'my-app/'`, or no suffix at all.

Each call returns a plain pota [signal](/signal) object — `.read()`,
`.write(v)`, and `.update(prev => next)`. The initial value comes from
storage when present, otherwise falls back to the `initial` argument.
Storage writes are wrapped in `try/catch` so quota or private-mode
failures don't crash anything — the signal still behaves correctly in
memory.

## Arguments

`storage(prefix)`:

| Argument | Type     | Description                                             |
| -------- | -------- | ------------------------------------------------------- |
| `prefix` | `string` | Prepended to every key; the caller picks the separator. |

**Returns:** a factory `(key, initial) => Signal`.

The returned factory:

| Argument  | Type     | Description                                                   |
| --------- | -------- | ------------------------------------------------------------- |
| `key`     | `string` | Stored under `prefix + key`.                                  |
| `initial` | `T`      | Optional fallback used when storage has no value for the key. |

**Returns:** a plain pota [signal](/signal) object.

## How it works

Reads happen synchronously at construction. Writes go to storage in a
synchronous effect, so the value is persisted by the time `write()`
returns — not on the next microtask.

Signals built from the same `prefix + key` within the same document
see each other's writes immediately — no manual subscription needed.
Browser-backed signals also react to the native `storage` event from
other tabs. If another tab calls `localStorage.clear()`, every active
signal reverts to its own initial value.

## Examples

### Persisting a single signal

Reload the page and the counter resumes from where you left it,
because the value is written to storage synchronously on every update.

```jsx
import { render } from 'pota'
import { storage } from 'pota/use/storage'

const store = storage('counter-demo:')
const count = store('count', 0)

function App() {
	return (
		<div>
			<p>persisted count: {count.read}</p>
			<button on:click={() => count.update(n => n + 1)}>
				increment
			</button>
			<button on:click={() => count.write(0)}>reset</button>
			<p>
				<small>reload the page — the count survives</small>
			</p>
		</div>
	)
}

render(App)
```

### Multiple signals share one namespace

`storage(prefix)` returns a factory you can call many times. Two
signals built from the same `prefix + key` stay in sync within the
same document — fan-out happens without any manual subscription.

```jsx
import { render } from 'pota'
import { storage } from 'pota/use/storage'

const settings = storage('settings:')

// two independent calls, same key — they stay in sync
const fontA = settings('font-size', 14)
const fontB = settings('font-size', 14)

function App() {
	return (
		<div>
			<p>signal A reads: {fontA.read}px</p>
			<p>signal B reads: {fontB.read}px</p>
			<button on:click={() => fontA.update(n => n + 1)}>
				bump from A
			</button>
			<button on:click={() => fontB.write(14)}>reset from B</button>
			<p>
				<small>
					both readouts update together — fan-out happens inside the
					same document
				</small>
			</p>
		</div>
	)
}

render(App)
```

### Cross-tab sync

Browser-backed signals follow the native `storage` event, so open this
page in a second tab and toggle the checkbox — both tabs update in
lockstep.

```jsx
import { render } from 'pota'
import { storage } from 'pota/use/storage'

const prefs = storage('prefs:')
const dark = prefs('dark', false)

function App() {
	return (
		<div
			style={{
				background: () => (dark.read() ? '#111' : '#fafafa'),
				color: () => (dark.read() ? '#eee' : '#111'),
				padding: '1rem',
			}}
		>
			<label>
				<input
					type="checkbox"
					prop:checked={dark.read}
					on:change={e => dark.write(e.currentTarget.checked)}
				/>
				dark mode
			</label>
			<p>
				<small>
					open this page in a second tab and toggle the checkbox —
					both tabs follow each other via the native storage event
				</small>
			</p>
		</div>
	)
}

render(App)
```
