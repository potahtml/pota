---
title: Pota
subpath: pota
topic: Renderer
desc:
  Base class for class components — extend it, define render(), and
  ready/cleanup are wired automatically.
---

# Pota

If a component class fits your use case, extend `Pota` and render the
class as you would any component. Define a `render(props)` method and
instances are created automatically when JSX uses the class.

If the subclass defines a `ready()` or `cleanup()` method, pota calls
them at the matching lifecycle points — you don't need to register
them manually. The instance has `this.props` available; signals stored
as instance fields work the same as in function components.

## Examples

### Counter class component

Signals live as instance fields, `ready()`/`cleanup()` are the mount
and dispose hooks, and `render(props)` returns the JSX.

```jsx
import { Pota, render, signal } from 'pota'

class Counter extends Pota {
	count = signal(0)

	ready() {
		console.log('counter mounted')
	}

	cleanup() {
		console.log('counter unmounted')
	}

	render(props) {
		return (
			<button on:click={() => this.count.update(n => n + 1)}>
				{props.label}: {this.count.read}
			</button>
		)
	}
}

render(<Counter label="clicks" />)
```

### Lifecycle and dispose

A `props` instance field acts as defaults; props passed in JSX merge
on top of them, and `this.props` inside `render()` is the frozen,
merged result. The handle returned by `render` disposes the tree,
firing `cleanup()`.

```jsx
import { Pota, render } from 'pota'

class MyComponent extends Pota {
	props = {
		some: 'default',
		children: 'quack',
	}
	ready() {
		console.log('ready callback!')
	}
	cleanup() {
		console.log('cleanup callback!')
	}
	render() {
		return <main>{this.props.children}</main>
	}
}

const dispose = render(
	<MyComponent some="lala">hello from class!</MyComponent>,
)

render(
	<button
		name="button"
		on:click={dispose}
	>
		dispose
	</button>,
)
```
