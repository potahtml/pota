---
title: XML
subpath: pota/xml
topic: Renderer
desc:
  Creates a sandboxed xml tagged-template with its own component
  registry.
---

# XML

`XML()` returns a fresh [`xml`](/xml/xml) tagged template with its own
component registry, isolated from the global `xml`. Reach for it when
you want a sandboxed surface — a docs site that exposes a curated set
of tags, or an embed where you don't want the global `xml` registry to
be polluted.

Use `xml.define({ Name })` on the returned instance to register
components by tag name. Registration must happen _before_ the first
template that references the name is compiled — once a template is
compiled, its component-vs-element decisions are fixed.

## Arguments

`XML()` takes no arguments.

**Returns:** an `xml` tagged-template function with two extra members:

| Member           | Type                                                    | Description                                                    |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `xml`            | `(template, ...values) => JSX.Element`                  | The tagged template itself — call it as `` xml`...` ``.        |
| `xml.components` | `Record<string, JSX.ElementType>`                       | The instance's registry, seeded with the built-in components.  |
| `xml.define`     | `(components: Record<string, JSX.ElementType>) => void` | Registers components addressable by tag name (case sensitive). |

## Examples

### Isolated instance with registered components

Creates a local `xml` instance and registers a `Card` component on it,
so `<Card/>` resolves to the component only within this instance.

```jsx
import { render } from 'pota'
import { XML } from 'pota/xml'

const xml = XML()

xml.define({
	Card: props => xml`
		<section style="border:1px solid #ccc; padding:1rem">
			<h3>${props.title}</h3>
			${props.children}
		</section>
	`,
})

const App = xml`
	<div>
		<Card title="Hello">
			<p>this came from a registered component</p>
		</Card>
		<Card title="World">
			<p>and so did this</p>
		</Card>
	</div>
`

render(App)
```

### Local component without touching the global registry

Defines a lowercase `test` tag on a file-local instance, leaving the
global `xml` untouched.

```jsx
import { render } from 'pota'
import { XML } from 'pota/xml'

const xml = XML()

xml.define({ test: () => 'hello world!' })

const App = xml`<div><test/> div contents</div>`

render(App)
```
