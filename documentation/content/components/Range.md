---
title: Range
kind: component
subpath: pota/components
topic: Flow
desc:
  Renders one entry per number in a numeric range, like range() wired
  into For.
---

# `<Range/>`

Renders one entry per number in a numeric range. Think of it as a
`range()` generator wired into [`<For/>`](/components/For): it
generates the numbers from `start` to `stop` — **inclusive**, unlike
Python's — and calls the child callback with each `(item, index)`.

All three bounds accept either a number or an accessor, so the range
can be driven by signals.

## Attributes

| name       | type                                           | description                                                                                                                                 |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `start?`   | `number \| Accessor<number>`                   | first value (default `0`). Always emitted.                                                                                                  |
| `stop?`    | `number \| Accessor<number>`                   | last value (default `0`), inclusive — when `step` skips past it, the final emitted value overshoots it. Counts up when `start < stop`, down when `start > stop`. |
| `step?`    | `number \| Accessor<number>`                   | increment between emitted values (default `1`). A negative `step` is normalised to its absolute value — pick direction with `start`/`stop`. |
| `children` | `(item: number, index: number) => JSX.Element` | callback invoked for each emitted number — same semantics as [`<For/>`](/components/For)'s child callback.                                  |

## Examples

### Numeric range

Drives a list length with a signal `stop`, adding and removing rows as
it changes.

```jsx
import { render, signal } from 'pota'
import { Range } from 'pota/components'

function App() {
	const stop = signal(5)

	return (
		<div>
			<button on:click={() => stop.update(n => n + 1)}>+</button>
			<button on:click={() => stop.update(n => Math.max(0, n - 1))}>
				−
			</button>
			<ul>
				<Range
					start={1}
					stop={stop.read}
				>
					{n => <li>row {n}</li>}
				</Range>
			</ul>
		</div>
	)
}

render(App)
```

### Descending range

Counts down by driving `start` above `stop`. A reactive `step` widens
or narrows the gap between emitted values.

```jsx
import { render, signal } from 'pota'
import { Range } from 'pota/components'

function App() {
	const step = signal(2)

	return (
		<div>
			<label>
				step:{' '}
				<input
					type="number"
					prop:value={step.read}
					on:input={e =>
						step.write(Math.max(1, Number(e.currentTarget.value) || 1))
					}
				/>
			</label>
			<ol>
				<Range
					start={10}
					stop={0}
					step={step.read}
				>
					{n => <li>countdown: {n}</li>}
				</Range>
			</ol>
		</div>
	)
}

render(App)
```

### Multiple children per number

The callback set is applied once per emitted number, so several
children render for each step of the range.

```jsx
import { render } from 'pota'
import { Range } from 'pota/components'

function App() {
	return (
		<main>
			<Range
				start={0}
				stop={10}
				step={2}
			>
				{item => <div>item: {item}</div>}
				{item => <div>double the item: {item * 2}</div>}
			</Range>
		</main>
	)
}

render(App)
```
