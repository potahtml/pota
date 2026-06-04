---
title: style:__
subpath: pota
topic: CSS
desc:
  Set inline styles as a namespaced property, a cssText string, or an
  object.
---

# `style:__`

Several ways to set inline styles on an element. Each form can be a
plain value or a function/signal. To remove a style, set its value to
`null`, `undefined`, or `false`. Object keys are CSS property names,
so they are **kebab-case** (`'flex-direction'`, not `flexDirection`).

## Forms

| form                             | what it does                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `style:color="red"`              | namespace form — sets a single property (supports custom properties too: `style:--brand="red"`) |
| `style="color:red"`              | string form — assigned to `style.cssText`, replacing any existing inline style                  |
| `style={{ color: 'red' }}`       | object form — each key becomes a single property set via `style.setProperty`                    |
| `style="color:var(--color)"`     | strings can reference CSS custom properties                                                     |
| `style:my-ns={{ color: 'red' }}` | nested object form — identical to the object form above; the `my-ns` part is ignored at runtime |

## Object form caveat

When you swap the object on a `style={...}` binding, properties that
were on the previous object but not on the new one are **not**
removed. Clear them explicitly by setting the value to `null`.

## Examples

### Every style form

String, object, and namespaced forms side by side — including a
multi-property object with kebab-case keys.

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			<div style="color:red">cssText string</div>
			<div style="color:blue;padding:4px">cssText + padding</div>
			<div style={{ color: 'orange' }}>object</div>
			<div
				style={{
					color: 'orange',
					'border-left': '1px solid grey',
					padding: '3px',
				}}
			>
				object with kebab-case keys
			</div>
			<div style:color="green">namespaced single property</div>
			<div style:--brand="purple" style="color:var(--brand)">
				namespaced custom property
			</div>
		</main>
	)
}

render(App)
```

### Reactive color from a signal

A style bound to a signal reader updates live. Pass the reader
(`color.read`), not a snapshot — the binding re-runs when the signal
changes.

```jsx
import { render, signal } from 'pota'

function App() {
	const color = signal('red')
	const colors = ['red', 'green', 'blue']

	return (
		<main>
			<div style:color={color.read}>{color.read}</div>
			<div style={() => `color:${color.read()}`}>
				cssText + signal
			</div>
			<button
				on:click={() =>
					color.update(
						c => colors[(colors.indexOf(c) + 1) % colors.length],
					)
				}
			>
				next color
			</button>
		</main>
	)
}

render(App)
```
