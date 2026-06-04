---
title: TypeScript
subpath: guide
topic: Getting started
desc:
  Component utility types, typing props, and declaring custom elements
  in pota.
---

# TypeScript

Component utility types, typing props, and declaring custom elements.
pota ships a set of ambient component-utility types in
`pota/typescript/jsx/components.d.ts`. Once your tsconfig has
`"jsxImportSource": "pota"`, these types are globally available — no
import line needed.

## Utility types

| name                  | shape                                                  | what it's for                                                                         |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `Component<P>`        | `(props: P) => JSX.Element`                            | any function component taking props P                                                 |
| `ParentComponent<P>`  | `Component<P & { children?: JSX.Element }>`            | component that accepts children — the typical layout/wrapper component                |
| `VoidComponent<P>`    | `Component<P>`                                         | component that explicitly does not accept children                                    |
| `FlowComponent<P, C>` | `Component<P & { children?: C }>`                      | flow-control component (Show, For, Switch) where `C` is a render-callback type        |
| `ComponentType<P>`    | `Component<P> \| (new (props: P) => JSX.ElementClass)` | anything that can be rendered as a component — function or class                      |
| `Children<C>`         | `C \| (C \| JSX.Element)[]`                            | mixed list of render callbacks and elements — useful for callback-style children      |
| `ComponentProps<T>`   | props of a component function or intrinsic tag         | extracts props from a component reference or tag name (`'button'`, `typeof MyButton`) |

## Examples

### Typing props

The simplest component is a function that receives a typed `props`
object. You don't need any of the utility types for this — an inline
object type is enough. Any prop you omit with a default is still
available to callers.

```tsx
import { render } from 'pota'

function Greeting({ name = 'Quack' }: { name?: string }) {
	return <p>Hi {name}</p>
}

render(<Greeting />)
```

### Component

`Component<P>` is an alias for `(props: P) => JSX.Element`. Reach for
it when you want the component's type visible at the declaration
(useful for reassignment, `defaultProps`-style patterns, or handing
the component to a higher-order function). The annotation also forces
the return type to be a JSX element, which catches accidental `void`
returns early.

```tsx
import { render } from 'pota'

type GreetingProps = { name?: string }

const Greeting: Component<GreetingProps> = ({ name = 'Quack' }) => (
	<p>Hi {name}</p>
)

render(<Greeting name="world" />)
```

### ParentComponent

A _parent_ component is one that renders children inside itself —
cards, layouts, providers. `ParentComponent<P>` adds a
`children?: JSX.Element` prop on top of `P` so you don't have to type
it yourself. Callers get autocomplete for `children` without the
component author reaching for `JSX.Element` explicitly.

```tsx
import { render } from 'pota'

const Card: ParentComponent<{ title: string }> = props => (
	<section class="card">
		<h2>{props.title}</h2>
		{props.children}
	</section>
)

render(
	<Card title="Hello">
		<p>inside the card</p>
	</Card>,
)
```

### VoidComponent

The opposite of `ParentComponent`: `VoidComponent<P>` is a component
that must not be passed children. Useful for self-closing leaf
elements like icons, avatars, or form primitives — catching stray
children at compile time prevents bugs where passed content would be
silently ignored.

```tsx
import { render } from 'pota'

const Avatar: VoidComponent<{ src: string; alt: string }> = props => (
	<img
		src={props.src}
		alt={props.alt}
		width="64"
		height="64"
	/>
)

render(
	<Avatar
		src="/assets/logo-small.png"
		alt="pota logo"
	/>,
)

// <Avatar src="…" alt="…">oops</Avatar>  ← type error
```

### FlowComponent

Flow-control components receive children as a function (or array of
functions) invoked with a value — the pattern `<Show/>`, `<For/>`,
`<Switch/>` use internally. `FlowComponent<P, C>` lets you type the
callback shape explicitly, so callers get parameter inference on their
render function and can't pass plain JSX where a callback is expected.
`Accessor<T>` is an ambient type for a reactive read-callback.

```tsx
import { render, signal } from 'pota'

const Counter: FlowComponent<
	{ start?: number },
	(count: Accessor<number>) => JSX.Element
> = props => {
	const count = signal(props.start ?? 0)
	return (
		<>
			<button on:click={() => count.update(n => n + 1)}>+1</button>
			{props.children?.(count.read)}
		</>
	)
}

render(
	<Counter start={10}>{count => <p>clicks: {count}</p>}</Counter>,
)
```

### ComponentType

`ComponentType<P>` is the union of a function component and a
component class — anything pota knows how to render. Use it for
generic code that works with either flavour: higher-order components,
or prop types that take "a component" without caring which kind.

```tsx
import { render } from 'pota'

function withBorder<P>(Inner: ComponentType<P>): Component<P> {
	return props => (
		<div style="border: 1px solid currentColor; padding: .5em">
			<Inner {...props} />
		</div>
	)
}

const Greeting: Component<{ name: string }> = props => (
	<p>Hi {props.name}</p>
)

const Bordered = withBorder(Greeting)

render(<Bordered name="world" />)
```

### Children

`Children<C>` widens a single callback type `C` into "either one `C`,
or a mixed array of `C` and plain JSX elements". It's the shape
`<Show/>` and `<Switch/>` accept for their children, so users can
interleave render callbacks with straightforward JSX without extra
wrappers.

```tsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

type Renderer<T> = (value: T) => JSX.Element

const MyShow: FlowComponent<
	{ when: unknown },
	Children<Renderer<unknown>>
> = props => <Show when={props.when}>{props.children}</Show>

const value = signal('hello')

render(
	<MyShow when={value.read}>
		{v => <p>first callback: {v}</p>}
		<hr />
		{v => <p>second callback: {v}</p>}
	</MyShow>,
)
```

### ComponentProps — forwarding props

`ComponentProps<T>` pulls the props type out of any function component
(`typeof Foo`) or intrinsic tag (`'button'`, `'a'`, …). It's how you
build a wrapper that forwards every prop the wrapped thing accepts,
without maintaining a parallel prop list as the underlying type
changes.

```tsx
import { render } from 'pota'

const PrimaryButton: Component<ComponentProps<'button'>> = props => (
	<button {...props} />
)

render(
	<PrimaryButton on:click={() => alert('clicked')}>
		click me
	</PrimaryButton>,
)
```

### Disallowing a prop

Wrap the underlying props with `Omit<T, K>` when the wrapper should
control a particular prop itself. Callers that try to pass the omitted
key get a compile error, making the intended usage visible at the type
level.

```tsx
import { render } from 'pota'

type SafeButtonProps = Omit<ComponentProps<'button'>, 'type'>

const SafeButton: Component<SafeButtonProps> = props => (
	<button
		type="button"
		{...props}
	/>
)

render(<SafeButton>Safe</SafeButton>)

// <SafeButton type="submit"/>  ← type error
```

### Requiring a prop

Most DOM props are optional by default. To force one required,
subtract it with `Omit` and add it back through `Required<Pick<…>>`.
Handy for accessibility-critical props like an `<img>`'s `alt` text.

```tsx
import { render } from 'pota'

type ImgProps = Omit<ComponentProps<'img'>, 'alt' | 'src'> &
	Required<Pick<ComponentProps<'img'>, 'alt' | 'src'>>

const Img: Component<ImgProps> = props => <img {...props} />

render(
	<Img
		src="/assets/logo-small.png"
		alt="pota logo"
		width="64"
		height="64"
	/>,
)

// <Img src="…"/>  ← type error: alt missing
```

### Custom use:ref factories

Behavior helpers in pota are ref factories — plain functions that
return `(node) => void`, attached via [`use:ref`](/guide/jsx/use:ref).
Typing one is the same as typing any other function: parameter types
are checked at the call site, and the return value is whatever
`use:ref` accepts (a function or nested array of functions).

```tsx
import { render } from 'pota'

type Tooltip = { text: string }

const tooltip = (opts: Tooltip) => (node: DOMElement) => {
	node.setAttribute('title', opts.text)
	// …attach behavior; cleanup runs via the surrounding scope
}

function App() {
	return <button use:ref={tooltip({ text: 'Hi' })}>hover me</button>
}

render(App)
```

For an argument that accepts both a plain value and a signal, widen
the parameter with `| (() => T)` and resolve it inside the body with
[withValue](/withValue).

### Custom Element

Declaring a custom element in TypeScript has two parts: tell the
compiler the tag exists, and describe its attributes. You do that by
merging into `JSX.IntrinsicElements` with a `declare module 'pota'`
block. To allow a signal as an attribute value, widen the type with
`() => T` — that matches pota's runtime acceptance of function values.

```tsx
import type { JSX } from 'pota'
import { render, signal } from 'pota'

declare module 'pota' {
	namespace JSX {
		interface IntrinsicElements {
			'some-element': JSX.HTMLAttributes<HTMLElement> & {
				'some-string'?: string
				'some-number'?: number
				'some-other'?: number | (() => number)
			}
		}
	}
}

function App() {
	const count = signal(0)

	return (
		<>
			<p>count: {count.read}</p>
			<some-element
				some-string="quack"
				some-number={1}
				some-other={count.read}
			/>
			<button on:click={() => count.update(n => n + 1)}>
				increment
			</button>
		</>
	)
}

render(App)
```
