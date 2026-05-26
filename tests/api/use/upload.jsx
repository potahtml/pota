/** @jsxImportSource pota */
// Tests for pota/use/upload: the imperative `uploadFile` primitive
// plus the `upload` and `dropzone` ref factories. XMLHttpRequest and
// fetch are mocked per-test so the suite never hits the network.

import { test, $, microtask, macrotask } from '#test'

import { render } from 'pota'
import { uploadFile, upload, dropzone } from 'pota/use/upload'

// ---------------------------------------------------------------
// Network mocks
// ---------------------------------------------------------------

/**
 * Replaces `XMLHttpRequest` and `fetch` on `globalThis` for the
 * duration of a test. Returns:
 *
 * - `xhrs`: the list of fake XHR instances created so far; each has
 *   `triggerProgress`, `triggerLoad`, `triggerError` helpers.
 * - `fetchCalls`: array of `{ input, init }` records.
 * - `setFetch(fn)`: install a custom fetch implementation.
 * - `restore()`: put the originals back. Call from `finally`.
 */
function mockNet() {
	const xhrs = []
	const origXHR = globalThis.XMLHttpRequest
	const origFetch = globalThis.fetch

	class FakeXHR {
		constructor() {
			xhrs.push(this)
			this.upload = new EventTarget()
			this._handlers = { load: [], error: [], abort: [] }
			this.status = 0
			this.statusText = ''
			this.responseText = ''
			this.aborted = false
			this.body = null
			this.method = ''
			this.url = ''
		}
		open(method, url) {
			this.method = method
			this.url = url
		}
		send(body) {
			this.body = body
		}
		abort() {
			this.aborted = true
			this._dispatch('abort')
		}
		addEventListener(type, cb) {
			;(this._handlers[type] ||= []).push(cb)
		}
		removeEventListener(type, cb) {
			const arr = this._handlers[type]
			if (!arr) return
			const i = arr.indexOf(cb)
			if (i >= 0) arr.splice(i, 1)
		}
		_dispatch(type) {
			for (const cb of [...(this._handlers[type] || [])]) cb()
		}
		triggerProgress(loaded, total) {
			this.upload.dispatchEvent(
				new ProgressEvent('progress', {
					lengthComputable: true,
					loaded,
					total,
				}),
			)
		}
		triggerLoad({
			status = 200,
			statusText = 'OK',
			responseText = '',
		} = {}) {
			this.status = status
			this.statusText = statusText
			this.responseText = responseText
			this._dispatch('load')
		}
		triggerError() {
			this._dispatch('error')
		}
	}

	globalThis.XMLHttpRequest = /** @type {any} */ (FakeXHR)

	const fetchCalls = []
	/** @type {(input: any, init: any) => Promise<Response>} */
	let fetchImpl = async () => new Response('', { status: 404 })
	globalThis.fetch = /** @type {any} */ (
		(input, init) => {
			fetchCalls.push({ input, init })
			return fetchImpl(input, init)
		}
	)

	return {
		xhrs,
		fetchCalls,
		setFetch(impl) {
			fetchImpl = impl
		},
		restore() {
			globalThis.XMLHttpRequest = origXHR
			globalThis.fetch = origFetch
		},
	}
}

const tick = async (n = 1) => {
	for (let i = 0; i < n; i++) await microtask()
}

/**
 * Spin until `cond()` is truthy or `max` ticks pass. Uses both
 * microtask and macrotask yields so it catches state advanced by Web
 * Crypto / fetch (which may schedule continuations off-microtask).
 */
const waitFor = async (cond, max = 80) => {
	for (let i = 0; i < max && !cond(); i++) {
		await microtask()
		if (cond()) return
		await macrotask()
	}
}

const dragEvent = (type, files = []) => {
	const dt = new DataTransfer()
	for (const f of files) dt.items.add(f)
	return new DragEvent(type, {
		bubbles: true,
		cancelable: true,
		dataTransfer: dt,
	})
}

// ---------------------------------------------------------------
// uploadFile — POST path
// ---------------------------------------------------------------

await test('uploadFile - POSTs FormData with default field name and returns response text', async expect => {
	const net = mockNet()
	try {
		const file = new File(['hello'], 'hi.txt', {
			type: 'text/plain',
		})
		const promise = uploadFile(file, {
			endpoint: 'https://example.com/up',
		})

		await tick()
		expect(net.xhrs.length).toBe(1)
		const xhr = net.xhrs[0]
		expect(xhr.method).toBe('POST')
		expect(xhr.url).toBe('https://example.com/up')
		expect(xhr.body instanceof FormData).toBe(true)
		expect(xhr.body.get('file')).toBe(file)

		xhr.triggerLoad({ responseText: 'https://cdn/abc.txt\n' })
		const result = await promise
		expect(result.url).toBe('https://cdn/abc.txt')
		expect(result.file).toBe(file)
		expect(result.hash).toBe(undefined)
	} finally {
		net.restore()
	}
})

await test('uploadFile - custom field name is used in FormData', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.bin', {
			type: 'application/octet-stream',
		})
		const promise = uploadFile(file, {
			endpoint: '/u',
			field: 'attachment',
		})
		await tick()
		const xhr = net.xhrs[0]
		expect(xhr.body.get('attachment')).toBe(file)
		expect(xhr.body.get('file')).toBe(null)

		xhr.triggerLoad({ responseText: 'ok' })
		await promise
	} finally {
		net.restore()
	}
})

await test('uploadFile - parseResponse is invoked when provided', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const promise = uploadFile(file, {
			endpoint: '/u',
			parseResponse: text => JSON.parse(text).url,
		})
		await tick()
		net.xhrs[0].triggerLoad({
			responseText: '{"url":"https://cdn/y.txt"}',
		})
		const result = await promise
		expect(result.url).toBe('https://cdn/y.txt')
	} finally {
		net.restore()
	}
})

await test('uploadFile - non-2xx response rejects', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const promise = uploadFile(file, { endpoint: '/u' })
		await tick()
		net.xhrs[0].triggerLoad({
			status: 500,
			statusText: 'Server Error',
		})
		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		expect(err instanceof Error).toBe(true)
		expect(/** @type {Error} */ (err).message.includes('500')).toBe(
			true,
		)
	} finally {
		net.restore()
	}
})

await test('uploadFile - network error rejects', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const promise = uploadFile(file, { endpoint: '/u' })
		await tick()
		net.xhrs[0].triggerError()
		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		expect(err instanceof Error).toBe(true)
		expect(
			/** @type {Error} */ (err).message.includes('network'),
		).toBe(true)
	} finally {
		net.restore()
	}
})

await test('uploadFile - progress events flow through onProgress', async expect => {
	const net = mockNet()
	try {
		const events = []
		const file = new File(['xxxxxxxxxx'], 'x.bin', {
			type: 'application/octet-stream',
		})
		const promise = uploadFile(file, {
			endpoint: '/u',
			onProgress: e => events.push(e),
		})
		await tick()
		// initial progress event fires with loaded:0 at send time
		expect(events.length).toBe(1)
		expect(events[0].loaded).toBe(0)
		expect(events[0].total).toBe(file.size)
		expect(events[0].file).toBe(file)

		net.xhrs[0].triggerProgress(5, 10)
		expect(events.length).toBe(2)
		expect(events[1].loaded).toBe(5)
		expect(events[1].total).toBe(10)

		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		await promise
		// completion progress event
		const last = events[events.length - 1]
		expect(last.loaded).toBe(file.size)
		expect(last.total).toBe(file.size)
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// uploadFile — existsUrl (content-addressed) path
// ---------------------------------------------------------------

await test('uploadFile - existsUrl hit returns cached URL without uploading', async expect => {
	const net = mockNet()
	try {
		net.setFetch(async () => new Response('', { status: 200 }))
		const file = new File(['data'], 'pic.png', {
			type: 'image/png',
		})
		const result = await uploadFile(file, {
			endpoint: '/u',
			existsUrl: (hash, f) =>
				'https://cdn/tmp/' + hash + '.' + f.name.split('.').pop(),
		})

		// no XHR was made
		expect(net.xhrs.length).toBe(0)
		expect(net.fetchCalls.length).toBe(1)
		expect(net.fetchCalls[0].init?.method).toBe('HEAD')

		// returned URL is the cached one (built from hash)
		expect(result.url.startsWith('https://cdn/tmp/')).toBe(true)
		expect(result.url.endsWith('.png')).toBe(true)
		expect(typeof result.hash).toBe('string')
		expect(result.hash.length).toBe(40) // SHA-1 hex
	} finally {
		net.restore()
	}
})

await test('uploadFile - existsUrl miss falls through to POST', async expect => {
	const net = mockNet()
	try {
		net.setFetch(async () => new Response('', { status: 404 }))
		const file = new File(['data'], 'pic.png', {
			type: 'image/png',
		})
		const promise = uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/tmp/' + hash,
		})
		// debug: ensure fetch ran and returned a Response with ok=false
		await waitFor(() => net.fetchCalls.length === 1)
		expect(net.fetchCalls.length).toBe(1)
		await waitFor(() => net.xhrs.length === 1)
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/new.png' })
		const result = await promise
		expect(result.url).toBe('https://cdn/new.png')
		expect(typeof result.hash).toBe('string')
		expect(result.hash.length).toBe(40)
	} finally {
		net.restore()
	}
})

await test('uploadFile - hash matches Web Crypto SHA-1 of file bytes', async expect => {
	const net = mockNet()
	try {
		const file = new File(['hello world'], 'h.txt', {
			type: 'text/plain',
		})
		// reference: compute hash directly
		const ref = await crypto.subtle.digest(
			'SHA-1',
			await file.arrayBuffer(),
		)
		const refHex = Array.from(new Uint8Array(ref))
			.map(b => b.toString(16).padStart(2, '0'))
			.join('')

		net.setFetch(async () => new Response('', { status: 200 }))
		const result = await uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/tmp/' + hash,
		})
		expect(result.hash).toBe(refHex)
	} finally {
		net.restore()
	}
})

await test('uploadFile - existsUrl fetch network error falls through to POST', async expect => {
	const net = mockNet()
	try {
		net.setFetch(async () => {
			throw new TypeError('failed to fetch')
		})
		const file = new File(['x'], 'x.png', { type: 'image/png' })
		const promise = uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/' + hash,
		})
		await waitFor(() => net.xhrs.length === 1)
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/x.png' })
		const result = await promise
		expect(result.url).toBe('https://cdn/x.png')
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// uploadFile — AbortSignal
// ---------------------------------------------------------------

await test('uploadFile - pre-aborted signal rejects immediately with AbortError', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const controller = new AbortController()
		controller.abort()
		let err
		try {
			await uploadFile(file, {
				endpoint: '/u',
				signal: controller.signal,
			})
		} catch (e) {
			err = e
		}
		expect(/** @type {Error} */ (err)?.name).toBe('AbortError')
		// no XHR should have been created
		expect(net.xhrs.length).toBe(0)
	} finally {
		net.restore()
	}
})

await test('uploadFile - aborting mid-flight rejects and calls xhr.abort()', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const controller = new AbortController()
		const promise = uploadFile(file, {
			endpoint: '/u',
			signal: controller.signal,
		})
		await tick()
		expect(net.xhrs.length).toBe(1)
		expect(net.xhrs[0].aborted).toBe(false)

		controller.abort()
		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		expect(/** @type {Error} */ (err)?.name).toBe('AbortError')
		expect(net.xhrs[0].aborted).toBe(true)
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// upload ref factory — basic flow
// ---------------------------------------------------------------

/**
 * Stuff `node.files` with a synthetic FileList and dispatch `change`.
 * Returns the FileList for assertions.
 */
function setInputFiles(node, files) {
	const dt = new DataTransfer()
	for (const f of files) dt.items.add(f)
	// `input.files` is a getter on the prototype; the writable
	// instance property used by some browsers in tests is unreliable
	// in Puppeteer/Chromium. Define an own property to override.
	Object.defineProperty(node, 'files', {
		configurable: true,
		value: dt.files,
	})
	node.dispatchEvent(new Event('change', { bubbles: true }))
	return dt.files
}

await test('upload - change event triggers uploadFile and onUpload receives an array', async expect => {
	const net = mockNet()
	try {
		const uploaded = []
		const dispose = render(
			<input
				type="file"
				use:ref={upload({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const file = new File(['x'], 'a.txt', { type: 'text/plain' })
		setInputFiles(input, [file])

		await waitFor(() => net.xhrs.length === 1)
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a.txt' })
		await waitFor(() => uploaded.length === 1)

		expect(uploaded.length).toBe(1)
		expect(Array.isArray(uploaded[0])).toBe(true)
		expect(uploaded[0].length).toBe(1)
		expect(uploaded[0][0].url).toBe('https://cdn/a.txt')
		expect(uploaded[0][0].file).toBe(file)

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - multiple files upload in parallel and report once via onUpload', async expect => {
	const net = mockNet()
	try {
		const uploaded = []
		const perFile = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
					onFile: r => perFile.push(r),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const a = new File(['a'], 'a.txt', { type: 'text/plain' })
		const b = new File(['b'], 'b.txt', { type: 'text/plain' })
		setInputFiles(input, [a, b])

		await tick(2)
		expect(net.xhrs.length).toBe(2)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a' })
		net.xhrs[1].triggerLoad({ responseText: 'https://cdn/b' })
		await tick(3)

		expect(perFile.length).toBe(2)
		expect(uploaded.length).toBe(1)
		expect(uploaded[0].length).toBe(2)
		const urls = uploaded[0].map(r => r.url).sort()
		expect(urls).toEqual(['https://cdn/a', 'https://cdn/b'])

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - clearOnUpload defaults to true (input.value reset)', async expect => {
	const net = mockNet()
	try {
		const dispose = render(
			<input
				type="file"
				use:ref={upload({ endpoint: '/u', onUpload() {} })}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		setInputFiles(input, [
			new File(['x'], 'x.txt', { type: 'text/plain' }),
		])
		// value is cleared synchronously inside the change handler
		expect(input.value).toBe('')

		await tick()
		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		await tick()

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - clearOnUpload:false leaves the input untouched', async expect => {
	const net = mockNet()
	try {
		const dispose = render(
			<input
				type="file"
				use:ref={upload({
					endpoint: '/u',
					clearOnUpload: false,
					onUpload() {},
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		setInputFiles(input, [file])
		// not cleared
		expect(input.files.length).toBe(1)
		expect(input.files[0]).toBe(file)

		await tick()
		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		await tick()

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - upload failure surfaces via onError and onUpload excludes it', async expect => {
	const net = mockNet()
	try {
		const errors = []
		const uploaded = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
					onError: (err, file) => errors.push({ err, file }),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const a = new File(['a'], 'a.txt', { type: 'text/plain' })
		const b = new File(['b'], 'b.txt', { type: 'text/plain' })
		setInputFiles(input, [a, b])

		await tick(2)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a' })
		net.xhrs[1].triggerLoad({ status: 500, statusText: 'err' })
		await tick(3)

		expect(errors.length).toBe(1)
		expect(errors[0].file).toBe(b)
		expect(uploaded.length).toBe(1)
		expect(uploaded[0].length).toBe(1)
		expect(uploaded[0][0].file).toBe(a)

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - onUpload does not fire if every file failed', async expect => {
	const net = mockNet()
	try {
		const errors = []
		const uploaded = []
		const dispose = render(
			<input
				type="file"
				use:ref={upload({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
					onError: err => errors.push(err),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		setInputFiles(input, [
			new File(['x'], 'x.txt', { type: 'text/plain' }),
		])
		await tick(2)
		net.xhrs[0].triggerLoad({ status: 500, statusText: 'err' })
		await tick(3)

		expect(errors.length).toBe(1)
		expect(uploaded.length).toBe(0)

		dispose()
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// upload ref factory — filters
// ---------------------------------------------------------------

await test('upload - accept filter rejects mismatched MIME types', async expect => {
	const net = mockNet()
	try {
		const rejects = []
		const uploaded = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					accept: 'image/*',
					onReject: (file, reason) => rejects.push({ file, reason }),
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const img = new File(['x'], 'pic.png', { type: 'image/png' })
		const doc = new File(['x'], 'a.pdf', { type: 'application/pdf' })
		setInputFiles(input, [img, doc])
		await waitFor(() => net.xhrs.length === 1)

		expect(rejects.length).toBe(1)
		expect(rejects[0].file).toBe(doc)
		expect(rejects[0].reason).toBe('type')
		// only the image was sent
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/pic.png' })
		await waitFor(() => uploaded.length === 1)
		expect(uploaded[0].length).toBe(1)
		expect(uploaded[0][0].file).toBe(img)

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - accept supports extension form (.pdf)', async expect => {
	const net = mockNet()
	try {
		const rejects = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					accept: '.pdf,.txt',
					onReject: (file, reason) => rejects.push({ file, reason }),
					onUpload() {},
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		// no MIME type, just extension
		const a = new File(['x'], 'a.pdf', { type: '' })
		const b = new File(['x'], 'b.zip', { type: '' })
		const c = new File(['x'], 'c.TXT', { type: '' })
		setInputFiles(input, [a, b, c])
		await tick(2)

		expect(rejects.length).toBe(1)
		expect(rejects[0].file).toBe(b)
		// .pdf and .TXT (case-insensitive) accepted
		expect(net.xhrs.length).toBe(2)
		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		net.xhrs[1].triggerLoad({ responseText: 'ok' })
		await tick(2)
		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - maxSize rejects files larger than the limit', async expect => {
	const net = mockNet()
	try {
		const rejects = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					maxSize: 5,
					onReject: (file, reason) => rejects.push({ file, reason }),
					onUpload() {},
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const small = new File(['abc'], 's.txt', { type: 'text/plain' })
		const big = new File(['abcdefghij'], 'b.txt', {
			type: 'text/plain',
		})
		setInputFiles(input, [small, big])
		await tick(2)

		expect(rejects.length).toBe(1)
		expect(rejects[0].file).toBe(big)
		expect(rejects[0].reason).toBe('size')
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		await tick(2)
		dispose()
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// upload ref factory — lifecycle
// ---------------------------------------------------------------

await test('upload - disposing aborts in-flight uploads silently (no onError)', async expect => {
	const net = mockNet()
	try {
		const errors = []
		const uploaded = []
		const dispose = render(
			<input
				type="file"
				use:ref={upload({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
					onError: e => errors.push(e),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		setInputFiles(input, [
			new File(['x'], 'x.txt', { type: 'text/plain' }),
		])
		await tick(2)
		expect(net.xhrs.length).toBe(1)

		dispose()
		// after dispose the controller aborts; xhr.abort fires the
		// 'abort' listener, which rejects the upload promise with
		// AbortError → onError should NOT be called
		await tick(3)
		expect(net.xhrs[0].aborted).toBe(true)
		expect(errors.length).toBe(0)
		expect(uploaded.length).toBe(0)
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// dropzone ref factory
// ---------------------------------------------------------------

await test('dropzone - drop dispatches files through the upload pipeline', async expect => {
	const net = mockNet()
	try {
		const uploaded = []
		const dispose = render(
			<div
				use:ref={dropzone({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const div = $('div')
		const file = new File(['x'], 'a.png', { type: 'image/png' })
		const e = dragEvent('drop', [file])
		div.dispatchEvent(e)
		// drop must be prevented (otherwise the browser would navigate
		// away on a real desktop drop)
		expect(e.defaultPrevented).toBe(true)

		await waitFor(() => net.xhrs.length === 1)
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a.png' })
		await waitFor(() => uploaded.length === 1)
		expect(uploaded.length).toBe(1)
		expect(uploaded[0][0].file).toBe(file)

		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - dragover is prevented so drop will fire', async expect => {
	const net = mockNet()
	try {
		const dispose = render(
			<div use:ref={dropzone({ endpoint: '/u', onUpload() {} })} />,
		)
		await microtask()
		const div = $('div')
		const e = dragEvent('dragover')
		div.dispatchEvent(e)
		expect(e.defaultPrevented).toBe(true)
		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - data-dragover toggles correctly across child crossings', async expect => {
	const net = mockNet()
	try {
		const dispose = render(
			<div use:ref={dropzone({ endpoint: '/u', onUpload() {} })} />,
		)
		await microtask()
		const div = $('div')

		// initial state: no attribute
		expect(div.hasAttribute('data-dragover')).toBe(false)

		div.dispatchEvent(dragEvent('dragenter'))
		expect(div.hasAttribute('data-dragover')).toBe(true)

		// entering a child increments the counter, attribute stays
		div.dispatchEvent(dragEvent('dragenter'))
		expect(div.hasAttribute('data-dragover')).toBe(true)

		// leaving the child decrements, still inside
		div.dispatchEvent(dragEvent('dragleave'))
		expect(div.hasAttribute('data-dragover')).toBe(true)

		// final leave clears
		div.dispatchEvent(dragEvent('dragleave'))
		expect(div.hasAttribute('data-dragover')).toBe(false)

		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - drop clears data-dragover even if dragleave never fired', async expect => {
	const net = mockNet()
	try {
		const dispose = render(
			<div use:ref={dropzone({ endpoint: '/u', onUpload() {} })} />,
		)
		await microtask()
		const div = $('div')

		div.dispatchEvent(dragEvent('dragenter'))
		expect(div.hasAttribute('data-dragover')).toBe(true)

		const file = new File(['x'], 'a.png', { type: 'image/png' })
		div.dispatchEvent(dragEvent('drop', [file]))
		expect(div.hasAttribute('data-dragover')).toBe(false)

		await tick(2)
		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		await tick(2)

		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - drop with no files is a no-op (no XHR, callbacks silent)', async expect => {
	const net = mockNet()
	try {
		const uploaded = []
		const dispose = render(
			<div
				use:ref={dropzone({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const div = $('div')
		div.dispatchEvent(dragEvent('drop'))
		await tick(2)
		expect(net.xhrs.length).toBe(0)
		expect(uploaded.length).toBe(0)
		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - filters apply to dropped files', async expect => {
	const net = mockNet()
	try {
		const rejects = []
		const uploaded = []
		const dispose = render(
			<div
				use:ref={dropzone({
					endpoint: '/u',
					accept: 'image/*',
					onReject: (f, r) => rejects.push({ f, r }),
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const div = $('div')
		const img = new File(['x'], 'a.png', { type: 'image/png' })
		const txt = new File(['x'], 'a.txt', { type: 'text/plain' })
		div.dispatchEvent(dragEvent('drop', [img, txt]))
		await waitFor(() => net.xhrs.length === 1)

		expect(rejects.length).toBe(1)
		expect(rejects[0].f).toBe(txt)
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a.png' })
		await waitFor(() => uploaded.length === 1)
		expect(uploaded[0][0].file).toBe(img)

		dispose()
	} finally {
		net.restore()
	}
})

await test('dropzone - listeners are cleaned up on dispose', async expect => {
	const net = mockNet()
	try {
		const uploaded = []
		const dispose = render(
			<div
				use:ref={dropzone({
					endpoint: '/u',
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const div = $('div')
		dispose()

		const file = new File(['x'], 'a.png', { type: 'image/png' })
		div.dispatchEvent(dragEvent('drop', [file]))
		await tick(2)
		expect(net.xhrs.length).toBe(0)
		expect(uploaded.length).toBe(0)
	} finally {
		net.restore()
	}
})
