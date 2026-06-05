---
title: upload
subpath: pota/use/upload
topic: Data
desc:
  A file-upload primitive plus ref factories for inputs and drop
  targets.
---

# `pota/use/upload`

`pota/use/upload` is an imperative file-upload primitive plus two ref
factories — the same upload pipeline (progress, optional
content-addressed dedup, cancellation) regardless of how the files
arrive. The [`uploadFile`](/use/upload/uploadFile) primitive does the
work; `upload` wires it to a file `<input>`, and
[`dropzone`](/use/upload/dropzone) wires it to a drop target.

## Exports

- [`uploadFile(file, options)`](/use/upload/uploadFile) — imperative
  primitive returning `Promise<UploadResult>`
- `upload(options)` — ref factory for `<input type="file">`
  (documented below)
- [`dropzone(options)`](/use/upload/dropzone) — ref factory for a drop
  target

## upload — ref factory for file inputs

`upload(options)` attaches to an `<input type="file">` and uploads its
selection on every `change` event. After upload the input is cleared
so re-selecting the same file fires `change` again — opt out with
`clearOnUpload: false`. In-flight uploads abort when the surrounding
reactive scope is disposed.

## Arguments

`upload(options)` takes a single options object and returns a ref
factory `(node: HTMLInputElement) => void`.

| Option          | Type                                | Description                                                                        |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `endpoint`      | `string`                            | URL the file is POSTed to as `multipart/form-data`.                                |
| `field`         | `string`                            | Form field name for the file (default `'file'`).                                   |
| `existsUrl`     | `(hash, file) => string`            | Optional content-addressed dedup: `HEAD` this URL first, skip upload on a 2xx.     |
| `parseResponse` | `(text, xhr) => string`             | Extract the result URL from the response body (default: trimmed body text).        |
| `accept`        | `string`                            | `<input accept>`-style filter; non-matching files fire `onReject(file, 'type')`.   |
| `maxSize`       | `number`                            | Max file size in bytes; larger files fire `onReject(file, 'size')`.                |
| `onProgress`    | `({ file, loaded, total }) => void` | Fires during the POST; cached/HEAD hits get one event with `loaded === total`.     |
| `onUpload`      | `(results) => void`                 | Fires once at the end with the array of successful `UploadResult`s. Required.      |
| `onFile`        | `(result) => void`                  | Fires per successfully uploaded file.                                              |
| `onError`       | `(error, file) => void`             | Fires per file that failed (aborted uploads are silent).                           |
| `onReject`      | `(file, reason) => void`            | Fires per file rejected by `accept`/`maxSize`; `reason` is `'type'` or `'size'`.   |
| `clearOnUpload` | `boolean`                           | Clear the input after upload so the same file can be re-selected (default `true`). |

**Returns:** a ref factory `(node: HTMLInputElement) => void` for
`use:ref`.

## Filters: accept and maxSize

`accept` mirrors `<input accept>`: MIME types (`image/png`), wildcard
MIME (`image/*`), extensions with leading dot (`.pdf`), comma-
separated lists. `maxSize` is in bytes. Files that don't match fire
`onReject(file, 'type' | 'size')` and never hit the network. These
options apply to `upload` and [`dropzone`](/use/upload/dropzone)
alike.

## Examples

### Upload from a file input

Attaches `upload` to a multiple file input with type and size filters
and the full set of lifecycle callbacks.

```jsx
import { render } from 'pota'
import { upload } from 'pota/use/upload'

function App() {
	return (
		<input
			type="file"
			multiple
			use:ref={upload({
				endpoint: '/api/upload',
				accept: 'image/*',
				maxSize: 5 * 1024 * 1024,
				onUpload: results => console.log('all done', results.length),
				onFile: r => console.log('done', r.url),
				onError: (err, file) => console.error(file.name, err.message),
				onReject: (file, reason) =>
					console.warn(file.name, 'rejected:', reason),
			})}
		/>
	)
}

render(App)
```

### Live progress per file

Tracks per-file progress in a [signal](/signal)-backed map and renders
a bar for each upload. `onProgress` fires repeatedly during the POST.

```tsx
import { render, signal } from 'pota'
import { For } from 'pota/components'
import { upload } from 'pota/use/upload'

function App() {
	const progress = signal<Record<string, number>>({})

	return (
		<>
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/api/upload',
					onProgress: ({ file, loaded, total }) =>
						progress.update(p => ({
							...p,
							[file.name]: loaded / total,
						})),
					onUpload: () => console.log('done'),
				})}
			/>
			<For each={() => Object.entries(progress.read())}>
				{([name, ratio]) => (
					<div>
						{name}: {() => Math.round(ratio * 100)}%
					</div>
				)}
			</For>
		</>
	)
}

render(App)
```
