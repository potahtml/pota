---
title: pasteFiles
subpath: pota/use/clipboard
topic: Interaction
desc: Ref factory that captures files pasted into an element.
---

# pasteFiles

`pasteFiles(handler)` is a ref factory from
[`pota/use/clipboard`](/use/clipboard). It fires only when at least
one `File` is present in the clipboard (pasted images, files copied
from the OS file manager, etc.) and runs `preventDefault()` so the
host doesn't also receive a textual representation.

## Examples

### Capture pasted files

Paste a file or screenshot into the focused target and list each
pasted `File`'s name, type, and size.

```jsx
import { render, signal } from 'pota'
import { For } from 'pota/components'
import { pasteFiles } from 'pota/use/clipboard'

function App() {
	const pasted = signal([])

	return (
		<main>
			<p>
				copy a file in your OS file manager (or take a screenshot)
				then click below and paste
			</p>
			<div
				tabindex="0"
				style={{
					border: '2px dashed #aaa',
					padding: '1rem',
					'min-height': '4rem',
				}}
				use:ref={pasteFiles(files => {
					pasted.write(
						files.map(f => ({
							name: f.name || '(unnamed)',
							type: f.type || 'unknown',
							size: f.size,
						})),
					)
				})}
			>
				click me, then paste (Ctrl/Cmd+V)
			</div>

			<ul>
				<For each={pasted.read}>
					{file => (
						<li>
							{file.name} —{' '}
							<small>
								{file.type}, {file.size}B
							</small>
						</li>
					)}
				</For>
			</ul>
		</main>
	)
}

render(App)
```
