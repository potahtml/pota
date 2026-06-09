/** @jsxImportSource pota */
// Coverage tests for pota/use/upload targeting the paths the main
// suite (tests/api/use/upload.jsx) doesn't reach:
//   - fileMatchesAccept: empty-after-trim accept (matches all) and the
//     exact-MIME branch (`type === part`)
//   - postFile: parseResponse throwing -> reject in the catch
//   - uploadFile existsUrl: signal aborted between hashing and HEAD;
//     HEAD hit firing onProgress; HEAD fetch rejecting with AbortError
//   - processFiles: every file filtered out -> early return
//   - upload change handler: no files / empty FileList -> early return
//
// XMLHttpRequest and fetch are mocked per-test so nothing hits the
// network; all globals are restored in finally.

import { test, $, microtask, macrotask } from '#test'

import { render } from 'pota'
import { uploadFile, upload } from 'pota/use/upload'

// ---------------------------------------------------------------
// Network mocks (mirrors tests/api/use/upload.jsx)
// ---------------------------------------------------------------

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

const waitFor = async (cond, max = 80) => {
	for (let i = 0; i < max && !cond(); i++) {
		await microtask()
		if (cond()) return
		await macrotask()
	}
}

/**
 * Define an own `files` property on a file input and dispatch a
 * `change` event (matching the main suite's helper). Pass `fileList`
 * directly (or `null`) to control exactly what `node.files` returns.
 */
function dispatchChange(node, fileList) {
	Object.defineProperty(node, 'files', {
		configurable: true,
		value: fileList,
	})
	node.dispatchEvent(new Event('change', { bubbles: true }))
}

function makeFileList(files) {
	const dt = new DataTransfer()
	for (const f of files) dt.items.add(f)
	return dt.files
}

// ---------------------------------------------------------------
// fileMatchesAccept — exact MIME + empty-accept branches
// (driven through the `upload` ref's accept filtering)
// ---------------------------------------------------------------

await test('upload - exact MIME accept matches the file type (type === part branch)', async expect => {
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
					// exact MIME, no wildcard and no leading dot -> hits the
					// `else if (type === part)` arm
					accept: 'text/plain',
					onReject: (file, reason) => rejects.push({ file, reason }),
					onUpload: arr => uploaded.push(arr),
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const txt = new File(['x'], 'a.txt', { type: 'text/plain' })
		const png = new File(['x'], 'a.png', { type: 'image/png' })
		dispatchChange(input, makeFileList([txt, png]))

		await waitFor(() => net.xhrs.length === 1)
		// only the exact-MIME match was accepted
		expect(net.xhrs.length).toBe(1)
		expect(rejects.length).toBe(1)
		expect(rejects[0].file).toBe(png)
		expect(rejects[0].reason).toBe('type')

		net.xhrs[0].triggerLoad({ responseText: 'https://cdn/a.txt' })
		await waitFor(() => uploaded.length === 1)
		expect(uploaded[0].length).toBe(1)
		expect(uploaded[0][0].file).toBe(txt)

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - accept that trims to no parts matches every file', async expect => {
	const net = mockNet()
	try {
		const rejects = []
		const dispose = render(
			<input
				type="file"
				multiple
				use:ref={upload({
					endpoint: '/u',
					// commas/whitespace only -> parts is empty after filter,
					// so `!parts.length` returns true and nothing is rejected
					accept: ' , , ',
					onReject: (file, reason) => rejects.push({ file, reason }),
					onUpload() {},
				})}
			/>,
		)
		await microtask()
		const input = /** @type {HTMLInputElement} */ ($('input'))
		const a = new File(['x'], 'a.bin', {
			type: 'application/octet-stream',
		})
		const b = new File(['x'], 'b.zip', { type: '' })
		dispatchChange(input, makeFileList([a, b]))

		await waitFor(() => net.xhrs.length === 2)
		// empty accept matches everything -> no rejects, both uploaded
		expect(rejects.length).toBe(0)
		expect(net.xhrs.length).toBe(2)

		net.xhrs[0].triggerLoad({ responseText: 'ok' })
		net.xhrs[1].triggerLoad({ responseText: 'ok' })
		await tick(3)

		dispose()
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// postFile — parseResponse throwing rejects via the catch
// ---------------------------------------------------------------

await test('uploadFile - parseResponse that throws rejects the upload', async expect => {
	const net = mockNet()
	try {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' })
		const boom = new Error('bad parse')
		const promise = uploadFile(file, {
			endpoint: '/u',
			parseResponse: () => {
				throw boom
			},
		})
		await tick()
		expect(net.xhrs.length).toBe(1)
		net.xhrs[0].triggerLoad({ responseText: 'whatever' })

		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		// the thrown error from parseResponse is what rejects the promise
		expect(err).toBe(boom)
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// uploadFile existsUrl path — abort after hashing, HEAD-hit
// progress, and HEAD fetch AbortError rethrow
// ---------------------------------------------------------------

await test('uploadFile - signal aborted between hashing and HEAD throws AbortError before fetch', async expect => {
	const net = mockNet()
	try {
		const controller = new AbortController()
		// abort once the SHA-1 hashing has resolved; the `signal?.aborted`
		// check right after sha1Hex then throws before any fetch happens.
		net.setFetch(async () => new Response('', { status: 200 }))
		const file = new File(['data'], 'pic.png', { type: 'image/png' })

		const promise = uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/' + hash,
			signal: controller.signal,
		})
		// abort while the await sha1Hex(file) is in flight
		controller.abort()

		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		expect(/** @type {Error} */ (err)?.name).toBe('AbortError')
		// the early abort check fires before fetch and before any XHR
		expect(net.fetchCalls.length).toBe(0)
		expect(net.xhrs.length).toBe(0)
	} finally {
		net.restore()
	}
})

await test('uploadFile - existsUrl HEAD hit fires onProgress with loaded === total', async expect => {
	const net = mockNet()
	try {
		net.setFetch(async () => new Response('', { status: 200 }))
		const events = []
		const file = new File(['data'], 'pic.png', { type: 'image/png' })
		const result = await uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/tmp/' + hash + '.png',
			onProgress: e => events.push(e),
		})

		// cache hit -> no upload happened
		expect(net.xhrs.length).toBe(0)
		expect(result.url.startsWith('https://cdn/tmp/')).toBe(true)

		// onProgress was called exactly once for the cache hit with a
		// completed-progress shape
		expect(events.length).toBe(1)
		expect(events[0].file).toBe(file)
		expect(events[0].loaded).toBe(file.size)
		expect(events[0].total).toBe(file.size)
	} finally {
		net.restore()
	}
})

await test('uploadFile - existsUrl HEAD fetch rejecting with AbortError is rethrown', async expect => {
	const net = mockNet()
	try {
		// the HEAD fetch rejects with an AbortError -> the catch rethrows
		// instead of falling through to a POST
		net.setFetch(async () => {
			throw new DOMException('Aborted', 'AbortError')
		})
		const file = new File(['data'], 'pic.png', { type: 'image/png' })
		const promise = uploadFile(file, {
			endpoint: '/u',
			existsUrl: hash => 'https://cdn/' + hash,
		})

		let err
		try {
			await promise
		} catch (e) {
			err = e
		}
		expect(/** @type {Error} */ (err)?.name).toBe('AbortError')
		// rethrow means we did NOT fall through to a POST
		expect(net.xhrs.length).toBe(0)
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// processFiles — every file filtered out -> early return
// ---------------------------------------------------------------

await test('upload - when every file is rejected by filters onUpload never fires', async expect => {
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
		const a = new File(['x'], 'a.txt', { type: 'text/plain' })
		const b = new File(['x'], 'b.pdf', { type: 'application/pdf' })
		dispatchChange(input, makeFileList([a, b]))

		// give processFiles a chance to run its early `!accepted.length`
		await tick(3)

		// both rejected, nothing accepted -> early return, no XHR, no
		// onUpload (Promise.all over empty would otherwise have fired it)
		expect(rejects.length).toBe(2)
		expect(net.xhrs.length).toBe(0)
		expect(uploaded.length).toBe(0)

		dispose()
	} finally {
		net.restore()
	}
})

// ---------------------------------------------------------------
// upload change handler — no files / empty FileList early returns
// ---------------------------------------------------------------

await test('upload - change with null files is a no-op (no files branch)', async expect => {
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
		// node.files === null -> `node.files ? ... : []` takes the else,
		// then `!files.length` returns early
		dispatchChange(input, null)
		await tick(3)

		expect(net.xhrs.length).toBe(0)
		expect(uploaded.length).toBe(0)

		dispose()
	} finally {
		net.restore()
	}
})

await test('upload - change with an empty FileList is a no-op (empty length branch)', async expect => {
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
		// non-null but empty FileList -> Array.from(...) is [], then
		// `!files.length` returns early (before clearing value/uploading)
		dispatchChange(input, makeFileList([]))
		await tick(3)

		expect(net.xhrs.length).toBe(0)
		expect(uploaded.length).toBe(0)

		dispose()
	} finally {
		net.restore()
	}
})
