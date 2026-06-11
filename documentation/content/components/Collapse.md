---
title: Collapse
kind: component
subpath: pota/components
topic: Flow
desc:
  Like Show, but hides its children with display:none instead of
  unmounting them.
---

# `<Collapse/>`

Like [`<Show/>`](/components/Show), renders its children based on a
condition — but when the condition turns falsy the subtree is _hidden_
rather than removed from the document. The children are wrapped in a
`<div>` whose `display` flips between `contents` (invisible to layout)
and `none`. State inside the children survives across hide/show, which
makes it the right tool for iframes, canvases, video, audio, or any
expensive widget you don't want to re-mount.

While `when` is falsy, an optional `fallback` is rendered in place of
the hidden children.

## Attributes

| name        | type          | description                                                                                       |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `when`      | `When<any>`   | when truthy the children are shown; when falsy they are hidden but stay mounted (state preserved) |
| `fallback?` | `JSX.Element` | rendered in place of the children while `when` is falsy                                           |

## Examples

### Hide without unmounting

Toggling `Collapse` hides the form but keeps it mounted, so the draft
text typed into the input survives across hide/show — a plain `Show`
would discard it.

```jsx
import { render, signal } from 'pota'
import { Collapse } from 'pota/components'

function HeavyForm() {
	const draft = signal('')
	return (
		<form>
			<label>draft (preserved when hidden):</label>
			<input
				prop:value={draft.read}
				on:input={e => draft.write(e.currentTarget.value)}
			/>
			<p>{() => `${draft.read().length} chars`}</p>
		</form>
	)
}

function App() {
	const open = signal(true)

	return (
		<div>
			<button on:click={() => open.update(o => !o)}>toggle</button>
			<Collapse when={open.read}>
				<HeavyForm />
			</Collapse>
		</div>
	)
}

render(App)
```

### Keeping media alive

A video keeps playing in the background even while the `Collapse` is
hidden, because the iframe is never torn down.

```jsx
import { render, signal } from 'pota'
import { Collapse } from 'pota/components'

function App() {
	const showing = signal(true)

	return (
		<>
			<button on:click={() => showing.update(s => !s)}>toggle</button>
			<Collapse when={showing.read}>
				<iframe
					width="560"
					height="315"
					src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=1"
					allow="autoplay; encrypted-media; picture-in-picture"
					allowfullscreen
				></iframe>
			</Collapse>
		</>
	)
}

render(App)
```

### Fallback while hidden

The hidden subtree stays alive (the video keeps playing) while the
`fallback` is shown in its place.

```jsx
import { render, signal } from 'pota'
import { Collapse } from 'pota/components'

function App() {
	const showing = signal(true)

	return (
		<>
			<button on:click={() => showing.update(s => !s)}>toggle</button>
			<Collapse
				when={showing.read}
				fallback={
					<div style={{ color: 'aquamarine' }}>
						The video is still playing — this is the fallback.
					</div>
				}
			>
				<iframe
					width="560"
					height="315"
					src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=1"
					allow="autoplay; encrypted-media; picture-in-picture"
					allowfullscreen
				></iframe>
			</Collapse>
		</>
	)
}

render(App)
```
