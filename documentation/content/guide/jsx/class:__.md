---
title: class:__
subpath: pota
topic: CSS
desc:
  Set CSS classes as a string, array, object, or namespaced per-class
  toggle.
---

# `class:__`

Several ways to set CSS classes on an element. Each form can be a
plain value or a function/signal — class bindings are reactive. To
remove a class, set it to `false`, `null` or `undefined`.

## Forms

| form                            | what it does                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `class="a b"`                   | sets the whole `class` attribute to the string (replaces any existing value)                                                                         |
| `class={["a", cond && "b"]}`    | array form — falsy entries are dropped, the rest are added                                                                                           |
| `class={{ a: true, b: false }}` | object form — adds keys with truthy values                                                                                                           |
| `class:a={truthy}`              | namespace form — toggles just the `a` class based on the value                                                                                       |
| `class:my-ns={{ a: true }}`     | nested object form — identical to the object form above; the `my-ns` part is ignored at runtime, only there so you can organise multi-class bindings |

## Object form caveat

When you swap the object on a `class={...}` binding, classes that were
on the previous object but not on the new one are **not** removed —
object forms add and update, they don't sweep. To clear a class, set
its value to `false` explicitly.

## Examples

### Every class form

The different ways to set CSS classes side by side — string, object,
namespaced toggle, and nested-object forms. [css](/use/css) injects
the stylesheet.

```jsx
import { render } from 'pota'
import { css } from 'pota/use/css'

function App() {
	return (
		<main>
			{css`
				.orange {
					color: orange;
				}
				.red {
					color: red;
				}
			`}

			<div class="orange">string</div>

			<div class={{ orange: true }}>object orange: true</div>
			<div class:orange={true}>namespace orange: true</div>
			<div class:my-ns={{ orange: true }}>
				nested object orange: true
			</div>

			<div class={{ orange: false }}>object orange: false</div>
			<div class:orange={false}>namespace orange: false</div>

			<div
				class="orange"
				class:orange={undefined}
			>
				namespace undefined keeps orange
			</div>
			<div
				class="orange"
				class:red={true}
			>
				string orange + namespace red
			</div>
		</main>
	)
}

render(App)
```

### Reactive toggle

A class bound to a signal reader toggles live. Pass the reader
`flag.read`, not `flag()` — the binding re-runs when the signal
changes.

```jsx
import { render, signal } from 'pota'
import { css } from 'pota/use/css'

function App() {
	const active = signal(false)

	return (
		<main>
			{css`
				.active {
					font-weight: bold;
					color: green;
				}
			`}

			<div class:active={active.read}>
				{() => (active.read() ? 'active' : 'inactive')}
			</div>
			<button on:click={() => active.update(v => !v)}>toggle</button>
		</main>
	)
}

render(App)
```
