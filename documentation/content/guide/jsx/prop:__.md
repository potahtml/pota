---
title: prop:__
subpath: pota
topic: Props
desc:
  Force a value to be assigned as a DOM property instead of an HTML
  attribute.
---

# `prop:__`

Forces the value to be assigned as a DOM _property_ instead of an HTML
attribute. The declarative counterpart of [setProperty](/setProperty);
for the attribute-vs-property defaults see
[attributes / properties](/guide/attributes-properties).

## When to use

By default pota writes to attributes. That works for most props, but
some are only correctly read back from the DOM property — or don't
exist as attributes at all. Use `prop:name` when:

- the property and the attribute diverge after the user interacts with
  the element — `value` and `checked` on form controls are the usual
  suspects
- you need to assign a non-string JavaScript value — `srcObject` on
  `<video>`, `files` on `<input type="file">`, or a custom-element
  property that expects an object
- you're writing a property that has no attribute equivalent —
  `innerText`, `textContent`, `innerHTML`

## Deleting

Assigning `null` or `undefined` to a `prop:` sets the property to
`null` (not `undefined`) — some elements (notably `<progress>`) break
if you set their property to `undefined`.

## Examples

### Textarea value

A `<textarea>`'s attribute and property diverge once the user edits
it; `prop:value` writes the live property rather than the initial
attribute.

```jsx
import { render } from 'pota'

function App() {
	return (
		<main>
			<textarea value="set via attribute">content</textarea>
			<hr />
			<textarea prop:value="set via prop:">content</textarea>
		</main>
	)
}

render(App)
```
