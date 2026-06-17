---
title: on
subpath: pota
topic: Reactive core
desc:
  Effect with explicit dependencies — only depend's reads subscribe,
  fn runs untracked.
---

# on

Effect with explicit dependencies. `on(depend, fn)` runs `depend` in a
tracking scope and `fn` outside of one — so only `depend`'s reads
become deps and reads inside `fn` stay snapshot-style. Handy when the
handler reads other signals you don't want as dependencies. The
auto-tracking form is [effect](/effect); for one-off untracked reads
inside an existing effect, see [untrack](/untrack).

## Arguments

| name     | type            | description                                                                 |
| -------- | --------------- | --------------------------------------------------------------------------- |
| `depend` | `() => unknown` | tracked function whose reads become the effect's dependencies               |
| `fn`     | `() => void`    | untracked body — runs once on creation, then after every change to `depend` |

**Returns:** `void`.

## Examples

### Explicit dependencies

Only `trigger` drives the effect; `noisy` is read as a snapshot. Click
_re-run_ to bump `trigger` and the effect fires; click _mutate noisy_
as many times as you like and it won't re-run until `trigger` changes
again.

```jsx
import { on, render, signal } from 'pota'

function App() {
	const trigger = signal(0)
	const noisy = signal('initial')
	const log = signal('')

	on(
		() => trigger.read(),
		() => {
			// reads `noisy` only as a snapshot — we don't want to
			// re-run when `noisy` changes
			log.write(`run #${trigger.read()} saw ${noisy.read()}`)
		},
	)

	return (
		<div>
			<p>{log.read}</p>
			<button on:click={() => trigger.update(n => n + 1)}>
				re-run
			</button>
			<button
				on:click={() =>
					noisy.write(`changed ${Math.random().toFixed(2)}`)
				}
			>
				mutate noisy (no re-run)
			</button>
		</div>
	)
}

render(App)
```
