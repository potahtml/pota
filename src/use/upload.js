import { addEvent, cleanup } from '../lib/reactive.js'

/**
 * Result of a successful upload. `hash` is only present when the
 * upload went through the content-addressed path (an `existsUrl` was
 * provided).
 *
 * @typedef {{
 * 	url: string
 * 	file: File
 * 	hash?: string
 * }} UploadResult
 */

/**
 * Options for {@link uploadFile} — the imperative primitive.
 *
 * @typedef {{
 * 	endpoint: string
 * 	existsUrl?: (hash: string, file: File) => string
 * 	field?: string
 * 	parseResponse?: (text: string, xhr: XMLHttpRequest) => string
 * 	onProgress?: (info: {
 * 		file: File
 * 		loaded: number
 * 		total: number
 * 	}) => void
 * 	signal?: AbortSignal
 * }} UploadFileOptions
 */

/**
 * Options shared by the {@link upload} and {@link dropzone} ref
 * factories. Extends {@link UploadFileOptions} with policy (`accept`,
 * `maxSize`) and lifecycle callbacks fired by the ref factories —
 * `uploadFile` itself is policy-free.
 *
 * @typedef {Omit<UploadFileOptions, 'signal'> & {
 * 	accept?: string
 * 	maxSize?: number
 * 	onUpload: (results: UploadResult[]) => void
 * 	onFile?: (result: UploadResult) => void
 * 	onError?: (error: Error, file: File) => void
 * 	onReject?: (file: File, reason: 'type' | 'size') => void
 * }} UploadOptions
 */

const HEX = '0123456789abcdef'

const toHex = (/** @type {Uint8Array} */ bytes) => {
	let s = ''
	for (let i = 0; i < bytes.length; i++) {
		s += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15]
	}
	return s
}

/**
 * SHA-1 hex digest of a file's bytes.
 *
 * @param {Blob} file
 * @returns {Promise<string>}
 */
const sha1Hex = async file => {
	const digest = await crypto.subtle.digest(
		'SHA-1',
		await file.arrayBuffer(),
	)
	return toHex(new Uint8Array(digest))
}

/**
 * Match a file against an `<input accept>`-style string: MIME
 * (`image/png`), wildcard MIME (`image/*`), extension with leading
 * dot (`.pdf`), comma-separated lists. Empty / missing `accept`
 * matches everything.
 *
 * @param {File} file
 * @param {string} accept
 * @returns {boolean}
 */
const fileMatchesAccept = (file, accept) => {
	const parts = accept
		.split(',')
		.map(s => s.trim().toLowerCase())
		.filter(Boolean)
	if (!parts.length) return true
	const type = file.type.toLowerCase()
	const name = file.name.toLowerCase()
	for (const part of parts) {
		if (part.startsWith('.')) {
			if (name.endsWith(part)) return true
		} else if (part.endsWith('/*')) {
			if (type.startsWith(part.slice(0, -1))) return true
		} else if (type === part) {
			return true
		}
	}
	return false
}

/**
 * POST a file via `XMLHttpRequest` so upload progress is observable
 * (`fetch` doesn't expose upload progress cross-browser).
 *
 * @param {File} file
 * @param {Required<
 * 	Pick<UploadFileOptions, 'endpoint' | 'field'>
 * > &
 * 	Pick<
 * 		UploadFileOptions,
 * 		'parseResponse' | 'onProgress' | 'signal'
 * 	>} opts
 * @returns {Promise<string>}
 */
const postFile = (file, opts) =>
	new Promise((resolve, reject) => {
		const { endpoint, field, parseResponse, onProgress, signal } =
			opts

		if (signal?.aborted) {
			reject(new DOMException('Aborted', 'AbortError'))
			return
		}

		const xhr = new XMLHttpRequest()
		xhr.open('POST', endpoint, true)

		const onAbort = () => xhr.abort()
		signal?.addEventListener('abort', onAbort)
		const detach = () => signal?.removeEventListener('abort', onAbort)

		xhr.upload.addEventListener('progress', e => {
			if (onProgress && e.lengthComputable) {
				onProgress({ file, loaded: e.loaded, total: e.total })
			}
		})

		xhr.addEventListener('load', () => {
			detach()
			if (xhr.status >= 200 && xhr.status < 300) {
				const text = xhr.responseText
				try {
					resolve(
						parseResponse ? parseResponse(text, xhr) : text.trim(),
					)
				} catch (err) {
					reject(/** @type {Error} */ (err))
				}
			} else {
				reject(
					new Error(`upload failed: ${xhr.status} ${xhr.statusText}`),
				)
			}
		})

		xhr.addEventListener('error', () => {
			detach()
			reject(new Error('upload failed: network error'))
		})

		xhr.addEventListener('abort', () => {
			detach()
			reject(new DOMException('Aborted', 'AbortError'))
		})

		const fd = new FormData()
		fd.append(field, file)
		onProgress?.({ file, loaded: 0, total: file.size })
		xhr.send(fd)
	})

/**
 * Upload a single file. When `existsUrl` is provided, the file is
 * SHA-1 hashed and a `HEAD` is issued against `existsUrl(hash,
 * file)`; on a 2xx response that URL is returned without uploading.
 * Otherwise the file is POSTed to `endpoint` as `multipart/form-data`
 * under `field` (default `'file'`), and the response body is used as
 * the result URL (override with `parseResponse`).
 *
 * Progress events fire with `{file, loaded, total}` during the POST.
 * Files served from cache (HEAD hit) get a single progress event with
 * `loaded === total` so progress UIs don't need to special-case.
 *
 * Pass an `AbortSignal` to cancel an in-flight upload — rejects with
 * a `DOMException` of name `AbortError`.
 *
 * @param {File} file
 * @param {UploadFileOptions} options
 * @returns {Promise<UploadResult>}
 * @url https://pota.quack.uy/use/upload
 */
export const uploadFile = async (file, options) => {
	const {
		endpoint,
		existsUrl,
		field = 'file',
		parseResponse,
		onProgress,
		signal,
	} = options

	let hash
	if (existsUrl) {
		hash = await sha1Hex(file)
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError')
		}
		const cachedUrl = existsUrl(hash, file)
		try {
			const res = await fetch(cachedUrl, {
				method: 'HEAD',
				signal,
			})
			if (res.ok) {
				onProgress?.({
					file,
					loaded: file.size,
					total: file.size,
				})
				return { url: cachedUrl, file, hash }
			}
		} catch (err) {
			if (/** @type {Error} */ (err)?.name === 'AbortError') {
				throw err
			}
			// network error / CORS — fall through and upload
		}
	}

	const url = await postFile(file, {
		endpoint,
		field,
		parseResponse,
		onProgress,
		signal,
	})
	onProgress?.({ file, loaded: file.size, total: file.size })
	return hash !== undefined ? { url, file, hash } : { url, file }
}

/**
 * Run a batch through filters and `uploadFile`, in parallel, firing
 * the configured lifecycle callbacks. `onUpload` fires once at the
 * end with the successfully uploaded results (filtered and failed
 * files are excluded from the array but reported via `onReject` /
 * `onError`). Aborted uploads are silent — they were cancelled
 * deliberately.
 *
 * @param {File[]} files
 * @param {UploadOptions} options
 * @param {AbortSignal} signal
 */
const processFiles = async (files, options, signal) => {
	const accepted = []
	for (const file of files) {
		if (options.accept && !fileMatchesAccept(file, options.accept)) {
			options.onReject?.(file, 'type')
			continue
		}
		if (
			options.maxSize !== undefined &&
			file.size > options.maxSize
		) {
			options.onReject?.(file, 'size')
			continue
		}
		accepted.push(file)
	}
	if (!accepted.length) return

	const settled = await Promise.all(
		accepted.map(file =>
			uploadFile(file, {
				endpoint: options.endpoint,
				existsUrl: options.existsUrl,
				field: options.field,
				parseResponse: options.parseResponse,
				onProgress: options.onProgress,
				signal,
			}).then(
				result => {
					options.onFile?.(result)
					return result
				},
				err => {
					if (/** @type {Error} */ (err)?.name !== 'AbortError') {
						options.onError?.(/** @type {Error} */ (err), file)
					}
					return null
				},
			),
		),
	)

	const ok = /** @type {UploadResult[]} */ (
		settled.filter(r => r !== null)
	)
	if (ok.length) options.onUpload(ok)
}

/**
 * Ref factory: attaches to an `<input type="file">` and uploads its
 * selection on every `change` event. After upload the input is
 * cleared so re-selecting the same file fires `change` again (opt out
 * with `clearOnUpload: false`).
 *
 * In-flight uploads are aborted when the surrounding reactive scope
 * is disposed.
 *
 * @param {UploadOptions & { clearOnUpload?: boolean }} options
 * @returns {(node: HTMLInputElement) => void}
 * @url https://pota.quack.uy/use/upload
 */
export const upload = options => node => {
	const controller = new AbortController()
	cleanup(() => controller.abort())

	addEvent(node, 'change', () => {
		const files = node.files ? Array.from(node.files) : []
		if (!files.length) return
		processFiles(files, options, controller.signal)
		if (options.clearOnUpload !== false) node.value = ''
	})
}

/**
 * Ref factory: turns the element into a drop target. Files dropped on
 * the element are run through the same pipeline as {@link upload}
 * (filters → upload → callbacks). While files are being dragged over,
 * the element gets a `data-dragover` attribute — style with
 * `[data-dragover]` in CSS.
 *
 * The standard `dragenter`/`dragleave` counter pattern is used so
 * crossing child elements doesn't strip the attribute mid-hover.
 *
 * In-flight uploads are aborted when the surrounding reactive scope
 * is disposed.
 *
 * @param {UploadOptions} options
 * @returns {(node: HTMLElement) => void}
 * @url https://pota.quack.uy/use/upload
 */
export const dropzone = options => node => {
	const controller = new AbortController()
	cleanup(() => controller.abort())

	let depth = 0

	addEvent(node, 'dragenter', e => {
		e.preventDefault()
		depth++
		if (depth === 1) node.dataset.dragover = ''
	})

	addEvent(node, 'dragover', e => {
		// required for `drop` to fire
		e.preventDefault()
	})

	addEvent(node, 'dragleave', () => {
		depth--
		if (depth <= 0) {
			depth = 0
			delete node.dataset.dragover
		}
	})

	addEvent(node, 'drop', e => {
		e.preventDefault()
		depth = 0
		delete node.dataset.dragover
		const files = e.dataTransfer?.files
		if (files?.length) {
			processFiles(Array.from(files), options, controller.signal)
		}
	})
}
