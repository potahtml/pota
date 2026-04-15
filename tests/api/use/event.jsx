/** @jsxImportSource pota */
// Tests for pota/use/event: preventDefault, stopPropagation, emit,
// waitEvent, addEventNative/removeEventNative, and passiveEvent.

import { test } from '#test'

import {
	addEventNative,
	emit,
	passiveEvent,
	preventDefault,
	removeEventNative,
	stopEvent,
	stopImmediatePropagation,
	stopPropagation,
	waitEvent,
} from 'pota/use/event'

await test('event - preventDefault and stop helpers mutate the event', expect => {
	const event = new Event('click', {
		bubbles: true,
		cancelable: true,
	})
	let stopped = false
	let immediate = false

	event.stopPropagation = () => {
		stopped = true
	}
	event.stopImmediatePropagation = () => {
		immediate = true
	}

	preventDefault(event)
	stopPropagation(event)
	stopImmediatePropagation(event)

	expect(event.defaultPrevented).toBe(true)
	expect(stopped).toBe(true)
	expect(immediate).toBe(true)
})

await test('event - stopEvent runs all stop helpers together', expect => {
	const event = new Event('submit', {
		bubbles: true,
		cancelable: true,
	})
	let stopped = false
	let immediate = false

	event.stopPropagation = () => {
		stopped = true
	}
	event.stopImmediatePropagation = () => {
		immediate = true
	}

	stopEvent(event)

	expect(event.defaultPrevented).toBe(true)
	expect(stopped).toBe(true)
	expect(immediate).toBe(true)
})

await test('event - emit dispatches a bubbling custom event with detail', expect => {
	const node = document.createElement('div')
	let detail

	let dispatched = false

	node.addEventListener('ping', event => {
		dispatched = true
		detail = /** @type {CustomEvent} */ (event).detail
	})

	emit(node, 'ping', {
		detail: { ok: true },
		bubbles: true,
		cancelable: true,
		composed: true,
	})

	expect(dispatched).toBe(true)
	expect(detail).toEqual({ ok: true })
})

await test('event - waitEvent resolves on the next matching event', async expect => {
	const node = document.createElement('div')
	const waiting = waitEvent(node, 'done')

	node.dispatchEvent(new Event('done'))

	const resolved = await waiting

	expect(resolved.type).toBe('done')
})

await test('event - waitEvent rejects the previous waiter for the same element', async expect => {
	const node = document.createElement('div')
	const first = waitEvent(node, 'done')
	const second = waitEvent(node, 'done')

	let rejected = false
	await first.catch(() => {
		rejected = true
	})

	node.dispatchEvent(new Event('done'))
	const resolved = await second

	expect(rejected).toBe(true)
	expect(resolved.type).toBe('done')
})

await test('event - addEventNative and removeEventNative work with function handlers', expect => {
	const node = document.createElement('button')
	const seen = []
	const handler = event => seen.push(event.type)

	addEventNative(node, 'click', handler)
	node.click()

	removeEventNative(node, 'click', handler)
	node.click()

	expect(seen).toEqual(['click'])
})

await test('event - addEventNative and removeEventNative preserve listener-object options', expect => {
	const node = document.createElement('div')
	const seen = []
	const handler = {
		once: true,
		handleEvent(event) {
			seen.push(event.type)
		},
	}

	addEventNative(node, 'custom', handler)
	node.dispatchEvent(new Event('custom'))
	node.dispatchEvent(new Event('custom'))

	removeEventNative(node, 'custom', handler)
	expect(seen).toEqual(['custom'])
})

await test('event - passiveEvent creates an event listener object', expect => {
	const node = document.createElement('div')
	let calls = 0
	const handler = passiveEvent(() => {
		calls++
	})

	addEventNative(node, 'scroll', handler)
	node.dispatchEvent(new Event('scroll'))
	removeEventNative(node, 'scroll', handler)
	node.dispatchEvent(new Event('scroll'))

	expect(handler.passive).toBe(true)
	expect(calls).toBe(1)
})

await test('event - emit with custom options overrides defaults', expect => {
	const node = document.createElement('div')
	/** @type {any} */
	let captured

	node.addEventListener('custom', e => {
		captured = e
	})

	emit(node, 'custom', {
		detail: { payload: 1 },
		bubbles: false,
		cancelable: false,
	})

	expect(captured.bubbles).toBe(false)
	expect(captured.cancelable).toBe(false)
	expect(captured.detail.payload).toBe(1)
})

// --- preventDefault on a non-cancelable event is a no-op --------------

await test('event - preventDefault on a non-cancelable event does not set defaultPrevented', expect => {
	const e = new Event('click', { cancelable: false })

	preventDefault(e)

	// Non-cancelable events ignore preventDefault per spec
	expect(e.defaultPrevented).toBe(false)
})

// --- emit with empty detail --------------------------------------------

await test('event - emit without detail still dispatches the event', expect => {
	const node = document.createElement('div')
	let fired = false

	node.addEventListener('plain', () => (fired = true))

	emit(node, 'plain')

	expect(fired).toBe(true)
})

// --- emit returns the event (or similar) -----------------------------

await test('event - emit on a disconnected node still dispatches', expect => {
	const node = document.createElement('div')
	let fired = false

	node.addEventListener('offline', () => (fired = true))

	// node is never appended to the document
	emit(node, 'offline', { detail: null })

	expect(fired).toBe(true)
})

// --- waitEvent rejects are cleaned up by subsequent waitEvent -------

await test('event - waitEvent with multiple rejections resolves correctly on last', async expect => {
	const node = document.createElement('div')
	const a = waitEvent(node, 'go')
	const b = waitEvent(node, 'go')
	const c = waitEvent(node, 'go')

	let aRejected = false
	let bRejected = false
	await a.catch(() => {
		aRejected = true
	})
	await b.catch(() => {
		bRejected = true
	})

	node.dispatchEvent(new Event('go'))
	const result = await c

	expect(aRejected).toBe(true)
	expect(bRejected).toBe(true)
	expect(result.type).toBe('go')
})

// --- stopPropagation does not set defaultPrevented --------------------

await test('event - stopPropagation alone does not set defaultPrevented', expect => {
	const e = new Event('click', { bubbles: true, cancelable: true })
	let stopped = false
	e.stopPropagation = () => {
		stopped = true
	}

	stopPropagation(e)

	expect(stopped).toBe(true)
	expect(e.defaultPrevented).toBe(false)
})
