---
title: xml
subpath: pota/xml
topic: Renderer
desc: Compiler-less tagged-template components — a JSX alternative.
---

# xml

`xml` is a tagged template that parses HTML-like markup at runtime and
produces a JSX-equivalent component — a compiler-less alternative to
JSX. Inspired and influenced by
[@trusktr](https://github.com/trusktr).

Templates are parsed as `text/xml`, so markup must be well-formed:
void elements need a trailing slash (`<br/>`, `<img src=""/>`), every
open tag must be closed, and attribute values must be quoted.
Ill-formed input renders a visible `parsererror` element rather than
throwing. Unlike the browser HTML parser, attributes, tags, and
components are **case sensitive**, matching JSX.

`xml` is the global, shared instance. For a sandboxed instance with
its own component registry, see [`XML()`](/xml/XML).

## Arguments

`xml` is a tagged template, so it is called as `` xml`markup` `` with
`${...}` interpolations rather than with positional arguments.

| Member           | Type                                                    | Description                                                    |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `${...}`         | `unknown`                                               | An interpolated value — anything `render` accepts.             |
| `xml.define`     | `(components: Record<string, JSX.ElementType>) => void` | Registers components addressable by tag name (case sensitive). |
| `xml.components` | `Record<string, JSX.ElementType>`                       | The registry, seeded with the built-in components.             |

**Returns:** a function (a component), so `xml` composes with
[`render`](/render), [`<Show/>`](/components/Show),
[`<Suspense/>`](/components/Suspense) and friends like any other
component.

## Predefined components

Every built-in component from `pota/components` is registered out of
the box — `For`, `Show`, `Switch`, `Match`, `Suspense`, `Dynamic`, and
the rest — so they can be referenced by tag name without calling
`xml.define`. The three lowercase/exception helpers `load`,
`customElement`, and `CustomElement` are intentionally **not**
registered.

## Notes

1. A `children` attribute applies only while the element has no
   `childNodes` (just like JSX). If the element has any children, the
   `children` attribute is ignored.
2. `xml.define` is case **sensitive**.
3. `xml.define` can override a name like `div`, making all `div` tags
   behave differently. This is a warning, not a recommendation.
4. Defining a component on the exported `xml` makes it global —
   visible wherever `xml` is imported. To avoid polluting the global
   registry, create a local instance with [`XML()`](/xml/XML).

## Examples

### Counter

A reactive template: pass the signal's reader `{count.read}` as a
child, and wire native events with `on:click`.

```jsx
import { signal, render } from 'pota'
import { xml } from 'pota/xml'

const count = signal(0)

const App = xml`
	<div>
		<p>count: ${count.read}</p>
		<button on:click="${() => count.update(n => n + 1)}">+</button>
		<button on:click="${() => count.write(0)}">reset</button>
	</div>
`

render(App)
```

### Interpolation

A `${...}` accepts anything `render` accepts — strings, numbers,
arrays, other `xml` components, even JSX elements. Interpolated text
is never parsed as markup, so a value like `<JSX>` stays literal text
rather than becoming a tag.

```jsx
import { render } from 'pota'
import { xml } from 'pota/xml'

const Bold = text => xml`<b>${text}</b>`

const App = xml`
	<div>
		${'Hola!'}
		${[4, 5, 6, Bold(' really')]}
		${Bold('whoa')}
		<u>${'Look mom no <JSX>'}</u>
		${(<div>:)</div>)}
	</div>
`

render(App)
```

### Defining a global component

Registering a component on the exported `xml` makes it addressable by
tag name everywhere `xml` is imported.

```jsx
import { render } from 'pota'
import { xml } from 'pota/xml'

xml.define({ test: () => 'hello world!' })

const App = xml`<div><test/> div contents</div>`

render(App)
```

### Using a built-in component

Built-in components like [`<For/>`](/components/For) work by tag name
without any registration.

```jsx
import { render } from 'pota'
import { xml } from 'pota/xml'

const App = xml`<For each="${[1, 2, 3]}">${val => val * 2}</For>`

render(App)
```

### Context flows through templates

[`context`](/context) propagates through `xml` templates exactly as it
does through JSX. Register the `Provider` (and any consumers) with
`xml.define`, then nest them — the value resolves by tree position.

```jsx
import { render, context } from 'pota'
import { XML } from 'pota/xml'

const xml = XML()

const Context = context({ myValue: 1 })

function Value() {
	return Context().myValue
}

xml.define({ Provider: Context.Provider, Value })

// renders "1 2 3 2 1"
const App = xml`
	<Value /> 
	<Provider value="${{ myValue: 2 }}">
		<Value /> 
		<Provider value="${{ myValue: 3 }}">
			<Value /> 
		</Provider>
		<Value /> 
	</Provider>
	<Value />
`

render(App)
```
