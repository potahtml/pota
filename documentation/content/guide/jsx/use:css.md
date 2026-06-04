---
title: use:css
subpath: pota
topic: CSS
desc:
  Adopt a scoped stylesheet onto an element, with a `class` keyword
  that becomes a random class.
---

# `use:css`

Inline a stylesheet onto an element. In the `use:css` attribute you
can use the keyword `class` in a selector — it's rewritten to a random
class name that's then added to the element. That way you co-locate a
scoped stylesheet with the markup without hand-generating a class. The
generated sheet is adopted into the element's owning document while
the element is mounted.

For the tagged-template helper that produces `CSSStyleSheet` objects
(and the `css` child form that adopts a sheet into the document), see
[pota/use/css](/use/css).

## Examples

### Inline CSS in an attribute

The `class` keyword inside the value is replaced with a generated
class name, which is also added to the element — so the rule applies
without you naming the class.

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			<section use:css="class:hover{color:red}">
				fancy css in attribute
			</section>
		</main>
	)
}

render(App)
```

### Adopting a sheet as a child

A [css](/use/css) tagged template produces a `CSSStyleSheet`. Placed
as a JSX child, it's adopted into the owning document while the
element is mounted, and removed when it is destroyed.

```jsx
import { render } from 'pota'
import { css } from 'pota/use/css'

function App() {
	return (
		<main>
			{css`
				section:hover {
					color: blue;
				}
			`}
			<section>fancy inline in the document</section>
		</main>
	)
}

render(App)
```
