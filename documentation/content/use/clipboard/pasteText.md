---
title: pasteText
subpath: pota/use/clipboard
topic: Interaction
desc: Ref factory that strips formatting from pasted text.
---

# pasteText

`pasteText()` is a ref factory from
[`pota/use/clipboard`](/use/clipboard). With no handler it intercepts
`paste` on `<input>`, `<textarea>`, and `contenteditable` hosts and
inserts only the clipboard's `text/plain` portion at the caret — no
rich-text styles, fonts, colors, or embedded images leak in. A
synthetic `input` event is dispatched so [`bind`](/use/bind) and other
input listeners pick up the programmatic edit. Pass a
`(text, event, node)` handler to massage the text first; the default
insertion is then skipped.

## Examples

### Strip formatting on paste

The first field uses the default insertion; the second passes a
handler that uppercases the plain text before inserting it.

```jsx
import { render } from 'pota'
import { pasteText } from 'pota/use/clipboard'

function App() {
	return (
		<main>
			<section>
				<p>
					paste rich text from anywhere — formatting, fonts, and
					colors are stripped to plain text
				</p>
				<input
					placeholder="paste here"
					use:ref={pasteText()}
					style={{ width: '100%' }}
				/>
			</section>

			<section>
				<p>
					with a handler, the default insertion is skipped — uppercase
					the pasted text first
				</p>
				<textarea
					rows={4}
					style={{ width: '100%' }}
					use:ref={pasteText((text, e, node) => {
						const start = node.selectionStart ?? node.value.length
						const end = node.selectionEnd ?? node.value.length
						node.setRangeText(text.toUpperCase(), start, end, 'end')
						node.dispatchEvent(new Event('input', { bubbles: true }))
					})}
				/>
			</section>
		</main>
	)
}

render(App)
```
