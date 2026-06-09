---
title: ref
subpath: pota
topic: Reactive core
desc:
  Creates a signal-function for capturing a DOM element via the
  use:ref attribute.
---

# ref

Creates a **signal-function** for capturing a DOM element. A
signal-function is a single callable that reads when invoked with no
arguments and writes when invoked with one — `r()` returns the current
value, `r(node)` stores it. `ref()` is the signal-function shape
specialised for refs, with no initial value.

Pass the ref to a native element's `use:ref` attribute. The renderer
calls the ref with the element (`r(element)`) immediately as the
element is created, so reading `r()` afterwards gives you the live DOM
node — handy for imperative work the declarative API doesn't cover
(focus, measurement, canvas, third-party widgets). The node is not
necessarily connected to the document yet, so defer layout-dependent
work to a [ready](/ready) callback. To compose several refs on one
element, pass an array: `use:ref={[a, b]}`.

For reactive _values_ rather than element handles, reach for
[signal](/signal). For two-way form binding, see [bind](/use/bind).

## Arguments

`ref()` takes no arguments.

**Returns:** a signal-function — call it with no args to read (`r()`),
call it with a value to write (`r(value)`). The renderer writes the
element into it when used as `use:ref`.

## API shape

```jsx
import { ref } from 'pota'

const r = ref()

r() // read — undefined until written
r(node) // write the value
```

## Examples

### Focus an input on mount

Capture the input element with `use:ref`, then read the ref inside a
[ready](/ready) callback (which fires once the node is connected) to
call `.focus()` imperatively.

```jsx
import { ready, ref, render } from 'pota'

function App() {
	const input = ref()

	ready(() => input().focus())

	return (
		<input
			placeholder="auto-focused"
			use:ref={input}
		/>
	)
}

render(App)
```

### Measure an element

A ref gives you the live DOM node, so you can read layout once it is
connected. Here a `ready` callback measures the box and writes the
result into a signal for display.

```jsx
import { ready, ref, render, signal } from 'pota'

function App() {
	const box = ref()
	const size = signal('')

	ready(() => {
		const r = box().getBoundingClientRect()
		size.write(`${Math.round(r.width)} × ${Math.round(r.height)}`)
	})

	return (
		<div>
			<div
				use:ref={box}
				style={{
					width: '12rem',
					height: '4rem',
					border: '1px solid currentColor',
				}}
			>
				measure me
			</div>
			<p>size: {size.read}</p>
		</div>
	)
}

render(App)
```

### Compose multiple refs

Pass an array to `use:ref` to write the same element into more than
one ref. Each ref is called with the node as the element is created.

```jsx
import { ready, ref, render, signal } from 'pota'

function App() {
	const a = ref()
	const b = ref()
	const result = signal('')

	ready(() => {
		result.write(`same node: ${a() === b()}`) // true
	})

	return (
		<div>
			<p use:ref={[a, b]}>captured by two refs</p>
			<p>{result.read}</p>
		</div>
	)
}

render(App)
```
