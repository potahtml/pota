---
title: Dynamic
kind: component
subpath: pota/components
topic: Flow
desc:
  Renders a component chosen at runtime; the component prop is read
  once and forwards the rest.
---

# `<Dynamic/>`

Renders a component chosen at runtime. The `component` prop is read
once when `<Dynamic/>` is created — it is _not_ reactive, so passing a
signal or a function that returns a component won't swap the rendered
output. To drive the component choice reactively, mount `<Dynamic/>`
inside a [Show](/components/Show) or [Switch](/components/Switch) that
toggles which one is shown. All other props are forwarded to the
rendered component. For the JavaScript equivalent see
[Component](/Component).

## Attributes

| name        | type                                     | description                                  |
| ----------- | ---------------------------------------- | -------------------------------------------- |
| `component` | `tagName \| fn \| Pota class \| Element` | what to render — read once, not reactive     |
| `…rest`     | any                                      | forwarded as props to the rendered component |

## Examples

### Data-driven block list

`<Dynamic/>` shines when the component identity is data-driven. Paired
with [`<For/>`](/components/For), each entry names which component to
use plus the props to forward; the lookup happens once per
`<Dynamic/>` creation, so adding a block of a given type creates a
fresh `Dynamic`.

```jsx
import { render, signal } from 'pota'
import { Dynamic, For } from 'pota/components'

const Heading = props => <h2>{props.text}</h2>
const Paragraph = props => <p>{props.text}</p>
const Quote = props => (
	<blockquote>
		<p>{props.text}</p>
		<footer>— {props.author}</footer>
	</blockquote>
)

const blockTypes = { Heading, Paragraph, Quote }

function App() {
	const blocks = signal([
		{ type: 'Heading', text: 'Pota in production' },
		{ type: 'Paragraph', text: 'A small reactive renderer.' },
		{
			type: 'Quote',
			text: 'Less is more.',
			author: 'Mies van der Rohe',
		},
	])

	return (
		<For each={blocks.read}>
			{block => (
				<Dynamic
					component={blockTypes[block.type]}
					{...block}
				/>
			)}
		</For>
	)
}

render(App)
```

### Tag names and components

`component` accepts a tag-name string, a function component, or any
other renderable — including a component that returns an array, which
is flattened into the output.

```jsx
import { render } from 'pota'
import { Dynamic } from 'pota/components'

function Bold(props) {
	return <b>{props.children}</b>
}
function List(props) {
	return props.list.map(item => item + '!')
}

function Even(props) {
	return props.list.filter(item => item % 2 === 0)
}

function Example() {
	return (
		<main>
			<Dynamic component={Bold}>Hello</Dynamic>
			<hr />
			<Dynamic component="h2">Quack</Dynamic>
			<hr />
			<Dynamic
				component={List}
				list={[1, 2, 3]}
			></Dynamic>
			<hr />
			<Dynamic
				component={Even}
				list={[1, 2, 3]}
			/>
		</main>
	)
}

render(Example)
```
