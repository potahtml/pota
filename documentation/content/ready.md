---
title: ready
subpath: pota
topic: Renderer
desc:
  Schedule a callback to run once the current render batch is
  connected to the DOM, before the next paint.
---

# ready

`ready(fn)` schedules a callback to run once the current render batch
is connected to the DOM, before the next paint — the place for
components that need to run some initialization.

A `ready` callback runs once the current processing batch is done —
i.e. after the full queue of `connected` callbacks has been processed,
and before the next paint. By then, the elements produced by the scope
should already be connected to the document. For a callback that also
waits on tracked async work, see [`readyAsync`](/readyAsync).

## Arguments

| name | type         | description                                       |
| ---- | ------------ | ------------------------------------------------- |
| `fn` | `() => void` | function to run once the processing batch is done |

## Examples

### Snippet

Runs an initialization callback once the component's batch is ready.

```jsx
import { ready, render } from 'pota'

function Component() {
	ready(() => render('Component is ready'))

	return <main></main>
}

render(Component)
```

### Focus on mount

Schedules imperative work that needs the node in the DOM — measuring
sizes, focusing inputs, attaching third-party widgets. `ready(fn)`
fires after the `onProps` and `onMount` phases (refs are assigned
synchronously at creation, earlier still).

```tsx
import { ready, ref, render } from 'pota'

function App() {
	const input = ref<HTMLInputElement>()

	ready(() => {
		input().focus()
		input().select()
	})

	return (
		<input
			use:ref={input}
			value="select me on mount"
		/>
	)
}

render(App)
```

### Timing

Displays current timings of `ready` vs `connected`.

```jsx
import { render, ready } from 'pota'

function BeforeSibling() {
	ready(() => render(<div>ready: BeforeSibling:component body</div>))

	return (
		<section
			use:connected={() =>
				render(<div>connected: from BeforeSibling</div>)
			}
		/>
	)
}
function AfterSibling() {
	ready(() => render(<div>ready: AfterSibling:component body</div>))

	return (
		<section
			use:connected={() =>
				render(<div>connected: from AfterSibling</div>)
			}
		/>
	)
}
function Test() {
	ready(() => render(<div>ready: component body</div>))
	return (
		<main
			use:connected={() =>
				render(<div>connected: from container</div>)
			}
		>
			<section>
				<div>
					<div
						use:connected={() => render(<div>connected: deep 1</div>)}
					/>
				</div>
			</section>
			<BeforeSibling />
			<section
				use:connected={() =>
					render(<div>connected: from inlined element</div>)
				}
			></section>
			<AfterSibling />
			<section>
				<div>
					<div
						use:connected={() => render(<div>connected: deep 2</div>)}
					/>
				</div>
			</section>
		</main>
	)
}

ready(() => render(<div>ready: Top level before render</div>))

render(Test)

ready(() => render(<div>ready: Top level after render</div>))
```
