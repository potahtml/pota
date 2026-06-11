---
title: isComponent
subpath: pota
topic: Renderer
desc:
  Returns true for functions tagged via markComponent — branch on
  renderable vs. plain getter.
---

# isComponent

`isComponent(value)` returns `true` for things tagged via
[markComponent](/markComponent). The renderer uses the same check; the
helper is exposed for component libraries that need to branch on "this
prop is a renderable" vs. "this prop is a getter".

## Arguments

| name    | type  | description       |
| ------- | ----- | ----------------- |
| `value` | `any` | the value to test |

**Returns:** `boolean` — `true` when `value` is a function marked as a
component.

## Examples

### Branching on renderables

Distinguishes a marked component prop from a plain value, rendering
each appropriately.

```jsx
import { isComponent, markComponent, render } from 'pota'

const Greeting = markComponent(() => <p>hello!</p>)
const plain = () => Math.random()

function Wrapper(props) {
	return (
		<div>
			{isComponent(props.body) ? props.body() : <p>{props.body}</p>}
		</div>
	)
}

function App() {
	return (
		<div>
			<p>isComponent(Greeting): {String(isComponent(Greeting))}</p>
			<p>isComponent(plain): {String(isComponent(plain))}</p>
			<Wrapper body={Greeting} />
		</div>
	)
}

render(App)
```
