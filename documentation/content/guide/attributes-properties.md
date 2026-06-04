---
title: attributes / properties
subpath: guide
topic: Getting started
desc:
  How pota decides between writing an attribute or a property, and the
  conventions that follow.
---

# attributes / properties

How pota decides whether an unnamespaced prop writes to an attribute
or a property, and the conventions that fall out of it.

## Attributes vs properties

pota defaults to setting _attributes_. Use the
[`prop:`](/guide/jsx/prop:__) namespace to force a property assignment
— typical cases: `value` and `checked` on form inputs, `srcObject` on
media, `innerHTML`, or any custom-element property that expects a
non-string value.

```jsx
const test = <video prop:srcObject={o} />
```

## Deleting

- **property** (`prop:*`): assigning `null` or `undefined` sets the
  property to `null`.
- **attribute** (default): passing `false`, `null` or `undefined`
  removes the attribute. `true` sets it to the empty string.

## Children

Passing `children` as a prop is only honoured when the element has no
explicit child nodes in JSX. If both are set, the explicit
`childNodes` win and the `children` prop is ignored.

## xmlns

The `xmlns` attribute is inherited by children, so SVG, MathML, and
other XML dialects work out of the box with their own namespaces — no
special wrapper needed.

## Events

Event names in [`on:*`](/guide/jsx/on:__) are case-sensitive —
`on:click` and `on:Click` bind different events. This matches how
custom events are typically named.

## Props with default behavior

| name                                              | description                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [`use:ref`](/guide/jsx/use:ref)                   | callback to get a reference to the element                                                             |
| [`use:connected`](/guide/jsx/use:connected)       | adds a callback to the mount event                                                                     |
| [`use:disconnected`](/guide/jsx/use:disconnected) | adds a callback to the unmount event                                                                   |
| [`class`](/guide/jsx/class:__)                    | sets classes on the element in various ways                                                            |
| [`style`](/guide/jsx/style:__)                    | sets styles on the element in various ways                                                             |
| [`use:css`](/guide/jsx/use:css)                   | `<span use:css="class{color:green} class:hover{color:red}"/>` becomes `<span class="c1ywn32bqhvrzp"/>` |

## Examples

### xmlns inheritance

A single `xmlns` covers a whole subtree — children inherit it, so SVG
(with `xlink:`) and MathML render with no special wrapper.

```jsx
import { render } from 'pota'

function App() {
	return (
		<>
			{/* children inherit the xmlns; xlink: works too */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				width="100"
				height="100"
			>
				<image
					width="100"
					height="100"
					xlink:href="/quack.png"
				/>
			</svg>

			{/* a different dialect, no wrapper needed */}
			<math xmlns="http://www.w3.org/1998/Math/MathML">
				<mfrac>
					<mi>p</mi>
					<mi>ρ</mi>
				</mfrac>
			</math>
		</>
	)
}

render(App)
```
