---
title: customElement
subpath: pota/components
topic: Custom Elements
desc: Idempotently register a custom element (define-once).
---

# customElement

`customElement(name, constructor, options?)` registers a custom
element with `customElements.define`, but only if the tag name has not
been defined yet. This makes it safe to call from modules that may be
imported more than once (hot reload, multiple entry points) without
throwing a `NotSupportedError`.

## Arguments

| name          | type                       | description                                                                                            |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `name`        | `string`                   | tag name — must contain a hyphen                                                                       |
| `constructor` | `CustomElementConstructor` | class extending `HTMLElement` (or [`CustomElement`](/components/CustomElement) from `pota/components`) |
| `options?`    | `ElementDefinitionOptions` | forwarded to `customElements.define` (for example `{ extends: 'button' }`)                             |

## Examples

### Idempotent registration

Register a custom element once; a second call with the same tag name
is a no-op, so it's safe to call from modules imported more than once.

```jsx
import { customElement } from 'pota/components'

class HelloEl extends HTMLElement {
	connectedCallback() {
		this.textContent = 'hello, world'
	}
}

customElement('x-hello', HelloEl)

// idempotent: calling again with a different class is a no-op
customElement('x-hello', class extends HTMLElement {})

document.body.append(document.createElement('x-hello'))
```
