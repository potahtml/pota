---
title: dropzone
subpath: pota/use/upload
topic: Data
desc: use:ref factory turning an element into a file drop target.
---

# dropzone

`dropzone(options)` turns the element into a drop target. Files
dropped on it run through the same pipeline as [`upload`](/use/upload)
(filters → upload → callbacks). While files are dragged over, the
element gets a `data-dragover` attribute — style it with
`[data-dragover]`. The standard `dragenter` / `dragleave` counter
pattern is used so crossing child elements doesn't strip the attribute
mid-hover. Part of [`pota/use/upload`](/use/upload).

## Arguments

`dropzone(options)` takes the same options object as
[`upload`](/use/upload) (minus `clearOnUpload`, which is
input-specific): `endpoint`, `field`, `existsUrl`, `parseResponse`,
`accept`, `maxSize`, `onProgress`, `onUpload`, `onFile`, `onError`,
`onReject`. See [`upload`](/use/upload) for the full table.

**Returns:** a ref factory `(node: HTMLElement) => void` for
`use:ref`. In-flight uploads abort when the surrounding reactive scope
is disposed.

## Examples

### A drop target

Turns a `<div>` into a drop zone that accepts images and PDFs. The
`[data-dragover]` selector lights up the outline while files hover.

```jsx
import { render } from 'pota'
import { dropzone } from 'pota/use/upload'

const css = `
	.drop-target {
		padding: 2rem;
		border: 1px solid #ccc;
	}
	.drop-target[data-dragover] {
		outline: 2px dashed #0a84ff;
	}
`

function App() {
	return (
		<>
			<style>{css}</style>
			<div
				class="drop-target"
				use:ref={dropzone({
					endpoint: '/api/upload',
					accept: 'image/*,application/pdf',
					onUpload: results =>
						console.log('uploaded', results.length),
				})}
			>
				Drop files here
			</div>
		</>
	)
}

render(App)
```
