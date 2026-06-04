---
title: Head
kind: component
subpath: pota/components
topic: Document
desc:
  Mounts children into document.head, deduplicating title, meta, and
  rel=canonical.
---

# `<Head/>`

Mounts its children into `document.head`. When a new child is inserted
there the runtime detects tags that should be unique and replaces the
existing one in place, so multiple pages/components can all contribute
to the head without duplicates.

`<Head/>` is a thin wrapper over [`<Portal/>`](/components/Portal)
targeting `document.head`. It stays reactive — updating a signal
updates the `title` or `meta` tag in place — and cleanup on unmount
removes whatever it inserted.

## Attributes

| name        | type | description                            |
| ----------- | ---- | -------------------------------------- |
| `children?` | any  | elements to mount in the document head |

## Deduplication

Every element inserted into `document.head` (via `<Head/>`, a portal,
or the renderer directly) is checked against the existing head. If a
match is found by the rules below, the existing element is _replaced_
with the new one.

| tag                      | matched by                                          |
| ------------------------ | --------------------------------------------------- |
| `<title>`                | there can only be one — any existing title          |
| `<meta>`                 | same `name` attribute, or same `property` attribute |
| `<link rel="canonical">` | any existing canonical link                         |

Tags that aren't in this list are appended as usual; they are not
deduplicated.

## Examples

### Title and meta from a component

A component contributes a `title` and a `meta` description to the
document head. Mounting the component replaces any existing title in
place.

```jsx
import { render } from 'pota'
import { Head } from 'pota/components'

function Component() {
	return (
		<Head>
			<title>The new Tab title</title>
			<meta
				name="description"
				content="the new meta description"
			/>
		</Head>
	)
}

render(Component)
```

### Reactive title and meta

The title and description track a signal — clicking a button rewrites
the document head in place without duplicating the tags.

```jsx
import { render, signal } from 'pota'
import { Head } from 'pota/components'

function App() {
	const page = signal('home')

	return (
		<div>
			<Head>
				<title>{() => `${page.read()} — my site`}</title>
				<meta
					name="description"
					content={() => `Page: ${page.read()}`}
				/>
			</Head>
			<button on:click={() => page.write('home')}>home</button>
			<button on:click={() => page.write('about')}>about</button>
		</div>
	)
}

render(App)
```
