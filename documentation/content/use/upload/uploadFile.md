---
title: uploadFile
subpath: pota/use/upload
topic: Data
desc:
  Imperative upload primitive with progress, dedup, and cancellation.
---

# uploadFile

`uploadFile(file, options)` uploads a single file with observable
progress, optional content-addressed dedup, and cancellation. It POSTs
the file via `XMLHttpRequest` so progress is reportable (`fetch`
doesn't expose upload progress cross-browser).

When `existsUrl` is provided, the file's SHA-1 hash is computed and a
`HEAD` request is issued against `existsUrl(hash, file)` first — a 2xx
response skips the upload and returns that cached URL. Otherwise the
file is POSTed to `endpoint` as `multipart/form-data` under `field`,
and the (trimmed) response body becomes the result URL unless
`parseResponse` overrides it. It is the policy-free primitive behind
the [`upload`](/use/upload) and [`dropzone`](/use/upload/dropzone) ref
factories.

## Arguments

| Argument  | Type                | Description                   |
| --------- | ------------------- | ----------------------------- |
| `file`    | `File`              | The file to upload.           |
| `options` | `UploadFileOptions` | Upload configuration (below). |

`options` fields:

| Field           | Type                                | Description                                                                                 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `endpoint`      | `string`                            | URL the file is POSTed to.                                                                  |
| `existsUrl`     | `(hash, file) => string`            | Optional. Maps a SHA-1 hash to a URL; a 2xx `HEAD` there skips the upload (dedup).          |
| `field`         | `string`                            | Form field name for the file. Defaults to `'file'`.                                         |
| `parseResponse` | `(text, xhr) => string`             | Optional. Extracts the result URL from the response. Defaults to the trimmed response text. |
| `onProgress`    | `({ file, loaded, total }) => void` | Optional. Fires during the POST; cache hits fire once with `loaded === total`.              |
| `signal`        | `AbortSignal`                       | Optional. Cancels an in-flight upload.                                                      |

**Returns:** `Promise<{ url, file, hash? }>`. `hash` is present only
when `existsUrl` was provided. Cancellation rejects with a
`DOMException` of name `AbortError`.

## Examples

### Upload a file imperatively

Uploads a file picked from an `<input>`, logging progress and the
resulting URL. An `AbortController` cancels the upload if the
component is torn down.

```jsx
import { render, signal } from 'pota'
import { uploadFile } from 'pota/use/upload'

function App() {
	const status = signal('idle')

	const onChange = async e => {
		const file = e.target.files[0]
		if (!file) return

		const controller = new AbortController()
		status.write('uploading')
		try {
			const { url } = await uploadFile(file, {
				endpoint: '/api/upload',
				onProgress: ({ loaded, total }) =>
					status.write(`${Math.round((loaded / total) * 100)}%`),
				signal: controller.signal,
			})
			status.write('done: ' + url)
		} catch (err) {
			status.write('failed: ' + err.message)
		}
	}

	return (
		<>
			<input
				type="file"
				on:change={onChange}
			/>
			<p>{status.read}</p>
		</>
	)
}

render(App)
```

### Content-addressed dedup

Computes the file's SHA-1 hash and checks `existsUrl(hash)` with a
`HEAD` request before uploading; if the bytes are already on the CDN,
the upload is skipped and the cached URL is returned with its `hash`.

```js
import { uploadFile } from 'pota/use/upload'

const { url, file, hash } = await uploadFile(file, {
	endpoint: '/api/upload',
	existsUrl: hash => '/cdn/' + hash,
	field: 'attachment',
	parseResponse: (text, xhr) => JSON.parse(text).url,
})
```
