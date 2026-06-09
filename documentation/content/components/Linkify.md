---
title: Linkify
kind: component
subpath: pota/components/Linkify
topic: Text
desc:
  Inline formatter for chat-style text — markers, media URLs, emoji
  shortcodes, and a highlight term.
---

# `<Linkify/>`

`<Linkify/>` is an inline formatter for chat-style text. It renders
lightweight Markdown-ish markers, recognises media URLs, optionally
substitutes `:emoji:` shortcodes, and can highlight a search term.

It returns the formatted nodes directly — no wrapper element — so the
result drops into whatever element you place it in.

## Attributes

| name         | type              | description                                                                                                                                                            |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text?`      | `string`          | The input to render.                                                                                                                                                   |
| `trim?`      | `boolean`         | Trim each line before joining. The outer string is always trimmed.                                                                                                     |
| `mark?`      | `string \| false` | Highlight occurrences of this term (case-insensitive), wrapping matches in `<mark>` — useful for search-result rendering.                                              |
| `emoji?`     | `boolean`         | Substitute `:shortcodes:` (and bare emoji) with unicode emoji.                                                                                                         |
| `guessType?` | `boolean`         | For media URLs with ambiguous extensions, HEAD the URL to learn its `Content-Type` and pick the renderer accordingly. Wrapped in [`<Suspense>`](/components/Suspense). |
| `scroll?`    | `() => void`      | Called when media loads — handy to pin a chat view to the bottom as images / videos resolve their natural size.                                                        |

## Markers

- `*bold*` — **bold**
- `/italic/` — _italic_
- `_underline_` — underline
- `-strike-` — strikethrough
- `|spoiler|` — hidden until clicked
- `` `code` `` — inline `code`, click to copy

A leading `>` wraps the whole block in `<q>`; a leading `/ `
italicises the whole block. Markers may nest; whitespace inside a
marker is preserved.

## Media URLs

Bare `http(s)://`, `blob:`, and `data:` URLs are turned into the
appropriate native media element (image / audio / video) when the
extension or MIME type is recognised. Everything else becomes a
regular anchor. `data:` URIs are wrapped in an object URL so the
rendered `src` stays compact; the object URL is revoked when the
surrounding scope tears down.

## Examples

### Markers and media

Renders bold / italic / spoiler markers and turns a recognised media
URL into the matching native element.

```jsx
import { render } from 'pota'
import { Linkify } from 'pota/components/Linkify'

function App() {
	return (
		<p>
			<Linkify text="hello *world*, /click/ the |secret| and see https://pota.quack.uy/logo.svg" />
		</p>
	)
}

render(App)
```

### Reactive input with highlight

`Linkify` formats its `text` once at construction, so to re-format on
change wrap the call in a reactive function child and pass plain
string snapshots. Here `mark` highlights every occurrence of the
search term as you type.

```jsx
import { render, signal } from 'pota'
import { Linkify } from 'pota/components/Linkify'

function App() {
	const text = signal('the *quick* brown fox jumps over the lazy dog')
	const term = signal('the')

	return (
		<div>
			<input
				prop:value={text.read}
				on:input={e => text.write(e.currentTarget.value)}
			/>
			<input
				prop:value={term.read}
				on:input={e => term.write(e.currentTarget.value)}
			/>
			<p>
				{() => (
					<Linkify
						text={text.read()}
						mark={term.read()}
					/>
				)}
			</p>
		</div>
	)
}

render(App)
```

### Emoji shortcodes

With `emoji`, `:shortcode:` sequences are replaced with unicode emoji.

```jsx
import { render } from 'pota'
import { Linkify } from 'pota/components/Linkify'

function App() {
	return (
		<p>
			<Linkify
				text="shipping it :rocket: with a :smile:"
				emoji
			/>
		</p>
	)
}

render(App)
```
