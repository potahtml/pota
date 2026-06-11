---
title: render
subpath: pota
topic: Renderer
desc:
  Mounts anything into an Element inside a fresh root and returns a
  disposer that unmounts it.
---

# render

Mounts anything into an `Element` inside a fresh root and returns a
disposer that unmounts it. It creates an owner scope with a
[root](/root) and hands back a dispose function that, when called,
unmounts the contents.

When called inside an existing reactive scope, the rendered tree is
disposed automatically if that scope gets disposed.

Rendering into a container does not clear the container, and disposing
what was rendered does not remove unrelated elements from it. For the
lower-level, owner-bound version that does not create a root, see
[insert](/insert).

## Arguments

| name       | type                                      | description                                                                                          |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `children` | `JSX.Element`                             | thing to render                                                                                      |
| `parent?`  | `Element \| DocumentFragment \| null`     | mount point (default: `document.body`); a `ShadowRoot` is a `DocumentFragment`                       |
| `options?` | `{ clear?: boolean; relative?: boolean }` | `clear` empties the target before inserting; `relative` inserts before `parent` instead of appending |

**Returns:** a dispose function (`() => void`).

## Important!

If you are passing to render a function, do not run the function
**before** passing it to render, else the function will run outside
the root tracking scope.

| call                        | status      |
| --------------------------- | ----------- |
| `render(App())`             | **wrong!**  |
| `render(App)`               | recommended |
| `render(<App/>)`            | ok          |
| `render(() => App)`         | ok          |
| `render(() => App())`       | ok          |
| `render(() => <App/>)`      | ok          |
| `render(<div/>)`            | ok          |
| `render(<><div/><div/></>)` | ok          |

## Examples

### Basic

Render a component to the `body` (default Element).

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			<section>Hello world</section>
		</main>
	)
}

render(App)
```

### Mount and dispose

Keep the disposer to tear the whole app down later — it cleans up
every reactive owner and removes the rendered DOM. Handy for tests,
hot reloading, or apps that mount into a host page.

```jsx
import { render, signal } from 'pota'

function App() {
	const count = signal(0)
	return (
		<button on:click={() => count.update(n => n + 1)}>
			clicks: {count.read}
		</button>
	)
}

const dispose = render(<App />)

// later, when you need to tear the app down:
// dispose()
```

### insert into scope

[insert](/insert) is the lower-level cousin of `render`: it places
content without wrapping it in a fresh root, so the content is owned
by the surrounding scope and disposes with it. Use it to project
content into a different DOM location from inside a component.

```jsx
import { insert, render, signal } from 'pota'

const host = document.createElement('aside')
host.style.cssText = 'border:1px dashed #888; padding:.5rem'
document.body.append(host)

function App() {
	const message = signal('hello from outside')

	// insert is owned by App's scope — its content disposes with App
	insert(<p>{message.read}</p>, host)

	return <p>main app</p>
}

render(App)
```

### Dispose

Dispose what has been rendered. Calling dispose won't clear unrelated
Elements from the same container. Clicking dispose will unmount `Test`
from `main`.

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			Unrelated elements arent removed on dispose
			<button
				name="button"
				on:click={() => dispose()}
			>
				dispose
			</button>
		</main>
	)
}
render(App)

function Test() {
	return <section>bye cruel world</section>
}

const dispose = render(Test, document.querySelector('main'))
```

### Multi

Render some elements into the body, then render some other components
into these elements.

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			<section id="section1"></section>
			<hr />
			<section id="section2"></section>
			<hr />
			<section id="section3"></section>

			<button
				name="button"
				on:click={() => dispose1()}
			>
				dispose 1
			</button>
			<button
				name="button"
				on:click={() => dispose2()}
			>
				dispose 2
			</button>
			<button
				name="button"
				on:click={() => dispose3()}
			>
				dispose 3
			</button>
			<button
				name="button"
				on:click={() => dispose()}
			>
				dispose all
			</button>
		</main>
	)
}

const dispose = render(App)

// components
const section1 = () => <b>Im in section 1</b>
const section2 = () => <b>Im in section 2</b>
const section3 = () => <b>Im in section 3</b>

// render these to each section
const dispose2 = render(section2, document.getElementById('section2'))
const dispose1 = render(section1, document.getElementById('section1'))
const dispose3 = render(section3, document.getElementById('section3'))
```

### Types

The render function can render pretty much anything.

```jsx
import { Pota, render } from 'pota'
import { css } from 'pota/use/css'

const div = document.createElement('div')
div.textContent = 'Im a div! '

const doc = new DocumentFragment()
doc.append('doc frag1', 'doc frag2')

const toRender = [
	function* () {
		yield 1
		yield 2
		yield 3
	},
	'a string',
	'',
	-1,
	0,
	-0,
	1,
	1000n,
	NaN,
	undefined,
	null,
	false,
	true,
	Symbol('hehe'),
	div,
	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
	new Set([12, 13, 14]),
	new Map().set(15, 15).set(16, 16).set(17, 17),
	<span>Im a span</span>,
	doc,
	function MyComponent() {
		return 'Hi! '
	},
	() => 'Test',
	new (class Something {
		toString(props) {
			return 'can I render too?'
		}
	})(),
	class Something extends Pota {
		render(props) {
			return 'do we render classes too!?'
		}
	},
	async function () {
		return 'no way, really?!'
	},
	new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve('wow')
		}, 2_500)
	}),
	Date,
	{
		name: 'Bender',
		toString: function () {
			return 'Im back baby -- ' + this.name
		},
	},
	{ hola: 'mundo', javier: 123 },
	css`
		body {
			background-color: rgba(255, 0, 0, 0.1);
		}
	`,
]

for (const component of toRender) {
	const dispose = render(component)
	render(
		<button
			name="button"
			on:click={dispose}
		>
			dispose
		</button>,
	)
	render(document.createElement('hr'))
}
```

### Clear

Clear the target container before mounting.

```jsx
import { render } from 'pota'

function App() {
	return <main>Hello World</main>
}

render(App)

render(
	<span>The content of the container has been replaced</span>,
	document.querySelector('main'),
	{
		clear: true,
	},
)
```

### Into a custom element

Render reactive content into a native custom element's shadow root.
The signal keeps updating the node inside the shadow DOM.

```jsx
import { render, signal } from 'pota'

class CounterBox extends HTMLElement {
	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })

		const count = signal(0)

		render(
			() => (
				<button on:click={() => count.update(n => n + 1)}>
					shadow clicks: {count.read}
				</button>
			),
			shadow,
		)
	}
}

customElements.define('counter-box', CounterBox)

document.body.append(document.createElement('counter-box'))
```
