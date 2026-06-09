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
import { Show } from 'pota/components'

const status = signal('not mounted')

class Counter extends Pota {
	count = signal(0)

	ready() {
		status.write('mounted')
	}

	cleanup() {
		status.write('unmounted')
	}

	render(props) {
		return (
			<button on:click={() => this.count.update(n => n + 1)}>
				{props.label}: {this.count.read}
			</button>
		)
	}
}

function App() {
	const show = signal(true)

	return (
		<div>
			<button on:click={() => show.update(v => !v)}>
				mount / unmount
			</button>
			<Show when={show.read}>
				<Counter label="clicks" />
			</Show>
			<p>status: {status.read}</p>
		</div>
	)
}

render(App)
```

### Lifecycle and dispose

A `props` instance field acts as defaults; props passed in JSX merge
on top of them, and `this.props` inside `render()` is the frozen,
merged result. The handle returned by `render` disposes the tree,
firing `cleanup()`.

```jsx
import { Pota, render, signal } from 'pota'

const log = signal('ready')

class MyComponent extends Pota {
	props = {
		some: 'default',
		children: 'quack',
	}
	ready() {
		log.write('ready callback!')
	}
	cleanup() {
		log.write('cleanup callback!')
	}
	render() {
		return <main>{this.props.children}</main>
	}
}

const dispose = render(
	<MyComponent some="lala">hello from class!</MyComponent>,
)

// the log lives outside the disposed tree, so it survives to
// show the cleanup message
render(
	<div>
		<button
			name="button"
			on:click={dispose}
		>
			dispose
		</button>
		<p>{log.read}</p>
	</div>,
)
```
