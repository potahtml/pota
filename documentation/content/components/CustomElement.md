---
title: CustomElement
kind: component
subpath: pota/components
topic: Custom Elements
desc: Base class for shadow-DOM web components in pota.
---

# `<CustomElement/>`

Base class for shadow-DOM web components in pota. Extend it for a
component with its own shadow root, adopted stylesheets, a `this.html`
setter that accepts a string or a JSX-yielding component, and a
`this.emit()` helper for dispatching custom events. Register the class
with [`customElement`](/components/customElement).

Anything beyond those conveniences — querying shadow children,
toggling `hidden`, inspecting slots — uses the standard DOM APIs
directly. For how attributes differ from properties in the renderer,
see [Attributes and Properties](/guide/attributes-properties).

## CustomElement Class

The `CustomElement` class provides an API for the things most commonly
needed on custom elements. It was developed to be used as a base class
for a pota components library.

On construct it attaches an open `shadowRoot` and adopts the
stylesheets listed in the two static class fields — `baseStyleSheets`
(intended for a shared reset / design-system layer) then `styleSheets`
(per-element). Both accept `CSSStyleSheet` instances or raw CSS
strings.

Adopting extra stylesheets at runtime isn't a method on the instance —
import `addStyleSheets` from `pota/use/css` and call it with the
shadow root. URLs and inline CSS strings are both accepted; URL
fetches are cached so siblings share the same `CSSStyleSheet`.

| name              | kind         | argument                      | description                                                                                                                                                                                         |
| ----------------- | ------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseStyleSheets` | Static field | `(CSSStyleSheet \| string)[]` | Stylesheets adopted into the shadow root before `styleSheets`. Intended for a shared reset / design-system layer.                                                                                   |
| `styleSheets`     | Static field | `(CSSStyleSheet \| string)[]` | Per-element stylesheets, adopted after `baseStyleSheets`.                                                                                                                                           |
| `html`            | Setter       | `string \| Component`         | Assign a `string` to write `shadowRoot.innerHTML`; assign a [Component](/Component) (or pass a falsy value to fall back to `<slot/>`) to replace the shadow root's children with the rendered tree. |
| `emit`            | Method       | `eventName, [init]`           | Dispatches a `CustomEvent` from the element. The second argument is the standard `CustomEventInit` bag (`{ detail, bubbles, composed, cancelable }`).                                               |

For anything else — querying shadow children, toggling attributes,
observing slot changes — use the standard DOM APIs directly:
`this.shadowRoot.querySelector(...)`,
`this.toggleAttribute('hidden', flag)`,
`this.shadowRoot.addEventListener('slotchange', fn)`.

## Examples

### Subclass CustomElement

Extend `CustomElement`, render the shadow tree from
`connectedCallback` by assigning a JSX-yielding function to
`this.html`, and dispatch a custom event with `this.emit` that the
host listens for with `on:*`.

```tsx
import { render, signal } from 'pota'
import { CustomElement, customElement } from 'pota/components'

class CounterEl extends CustomElement {
	static styleSheets = [`button { font-weight: bold }`]

	count = signal(0)

	connectedCallback() {
		this.html = () => (
			<button on:click={() => this.bump()}>
				count: <span class="n">{this.count.read}</span>
			</button>
		)
	}

	bump() {
		this.count.update(n => n + 1)
		this.emit('changed', { detail: this.count.read() })
	}
}

customElement('my-counter', CounterEl)

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'my-counter': JSX.HTMLAttributes<HTMLElement>
		}
	}
}

const last = signal(0)

render(
	<>
		<my-counter on:changed={e => last.write(e.detail)} />
		<span> last 'changed' detail: {last.read}</span>
	</>,
)
```

### Adopting stylesheets

Assigning a string to `this.html` writes the shadow HTML; reassigning
a JSX component later swaps the shadow tree to a reactive render. The
`css` tagged template supplies the adopted stylesheet.

```tsx
import { render } from 'pota'
import { CustomElement, customElement } from 'pota/components'
import { css } from 'pota/use/css'

class MyElement extends CustomElement {
	static styleSheets = [
		css`
			:host {
				color: aqua;
			}
		`,
	]

	constructor() {
		super()
		this.html = 'hello <b><slot/></b>!'
		setTimeout(() => {
			this.html = () => <b>JSX Component takes over!</b>
		}, 2000)
	}
}

customElement('hello-world', MyElement)

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'hello-world': JSX.HTMLAttributes<HTMLElement>
		}
	}
}

render(<hello-world>World</hello-world>)
```
