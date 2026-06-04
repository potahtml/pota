---
title: Component
subpath: pota
topic: Renderer
desc:
  Turns any value into a callable component factory, optionally with
  preset props.
---

# Component

`Component` turns any value into a callable factory, useful for
creating dynamic or untracked components. You can preset props at
factory time; calling the factory with more props shallow-merges them
over the presets (_later wins, key-by-key_). For the JSX equivalent
see [`<Dynamic/>`](/components/Dynamic); for class-style components,
see [`Pota`](/Pota).

When the second argument is omitted, `Component` just wraps `value` so
it can be invoked imperatively and keep receiving fresh props on each
call.

## Arguments

| name     | type                                              | description                                                                                                                                                                     |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`  | string \| Function \| Element \| object \| symbol | what to turn into a factory. Strings become intrinsic elements (`'div'`); functions become user components; `Element`s are wrapped as-is; anything else renders via `toString`. |
| `props?` | object                                            | preset props. Omitted entirely when you only want the factory. When the factory is later called with overrides, the two are shallow-merged as `{ ...preset, ...override }`.     |

**Returns:** a component function `(props?) => JSX.Element`.

## Examples

### Component with fixed props

Pre-bake a tag's props once, then drop the result into JSX like any
other component. The preset `class` and `type` ride along while each
usage adds its own children and events.

```jsx
import { Component, render } from 'pota'

const PrimaryButton = Component('button', {
	class: 'btn primary',
	type: 'button',
})

function App() {
	return (
		<div>
			<PrimaryButton on:click={() => alert('hi')}>save</PrimaryButton>
			<PrimaryButton on:click={() => alert('cancel')}>
				cancel
			</PrimaryButton>
		</div>
	)
}

render(App)
```

### Component as a factory

Capture default props and reuse the factory across several usages.

```jsx
import { Component, render } from 'pota'

function App() {
	const Element = Component('marquee', {
		children: 'hello world',
		'style:color': 'aqua',
	})

	return (
		<main>
			<Element />
			<Element />
		</main>
	)
}

render(App)
```

### Component with props override

Calling the factory with new props shallow-merges them over the
presets, so `children` and `style:color` can be overridden per usage.

```jsx
import { Component, render } from 'pota'

function App() {
	const Element = Component('marquee', {
		children: 'hello world',
		'style:color': 'aqua',
	})

	return (
		<main>
			<Element />
			<Element>bye world</Element>
			<Element style:color="lime" />
		</main>
	)
}

render(App)
```

### Component with no preset props

The `props` argument may be omitted; the factory then takes all its
props at call time.

```jsx
import { Component, render } from 'pota'

function App() {
	const Fun = Component('marquee')

	return (
		<main>
			<Fun style:color="aqua">Hi there :)</Fun>
			<Fun style:color="aquamarine">Im bender from the future</Fun>
		</main>
	)
}

render(App)
```
