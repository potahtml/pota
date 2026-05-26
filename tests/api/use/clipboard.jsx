/** @jsxImportSource pota */
// Tests for pota/use/clipboard: the `clipboard` ref factory copies
// string values, reads from node text, and supports callback handlers.

import { test, $, $$, microtask } from '#test'

import { render } from 'pota'
import { clipboard, pasteFiles, pasteText } from 'pota/use/clipboard'

await test('clipboard - copies explicit string values', async expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<button use:ref={clipboard('copied value')}>Copy</button>,
	)

	await microtask()

	$('button').click()

	expect(writes).toEqual(['copied value'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

await test('clipboard - can read text from the node or a callback', async expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<>
			<button use:ref={clipboard(true)}> Inner Value </button>
			<button
				id="callback-copy"
				use:ref={clipboard(event => event.type + '-value')}
			>
				ignored
			</button>
		</>,
	)

	await microtask()

	const [first, second] = $$('button')
	first.click()
	second.click()

	expect(writes).toEqual(['Inner Value', 'click-value'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

// --- multiple clicks copy multiple times --------------------------------

await test('clipboard - multiple clicks queue multiple copy operations', async expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<button use:ref={clipboard('multi')}>Copy</button>,
	)

	await microtask()

	$('button').click()
	$('button').click()
	$('button').click()

	expect(writes).toEqual(['multi', 'multi', 'multi'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

// --- clipboard copies only trimmed innerText when value is true -------

await test('clipboard - clipboard(true) trims surrounding whitespace', async expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<button use:ref={clipboard(true)}> padded </button>,
	)

	await microtask()
	$('button').click()

	expect(writes).toEqual(['padded'])

	dispose()
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

// --- clipboard handler stops receiving events after dispose ----------

await test('clipboard - click handler is cleaned up on dispose', async expect => {
	const writes = []
	const original = navigator.clipboard

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(text) {
				writes.push(text)
				return Promise.resolve()
			},
		},
	})

	const dispose = render(
		<button use:ref={clipboard('value')}>Copy</button>,
	)

	await microtask()
	const button = $('button')

	button.click()
	expect(writes).toEqual(['value'])

	dispose()

	// Attempt another click after dispose (button should be gone)
	button.click()
	expect(writes).toEqual(['value'])

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

// --- pasteText -------------------------------------------------------

/**
 * Dispatch a synthetic `paste` event carrying `text` (and optional
 * files) as if the user pasted into `node`. Returns the event so the
 * caller can assert on `defaultPrevented`.
 */
function dispatchPaste(node, text, files = []) {
	const data = new DataTransfer()
	if (text) data.setData('text/plain', text)
	for (const f of files) data.items.add(f)
	const e = new ClipboardEvent('paste', {
		clipboardData: data,
		bubbles: true,
		cancelable: true,
	})
	node.dispatchEvent(e)
	return e
}

await test('pasteText - default insertion into <input> at the caret', async expect => {
	const dispose = render(
		<input type="text" value="ab" use:ref={pasteText()} />,
	)
	await microtask()
	const input = /** @type {HTMLInputElement} */ ($('input'))
	// caret between 'a' and 'b'
	input.focus()
	input.setSelectionRange(1, 1)

	const e = dispatchPaste(input, 'XYZ')
	expect(e.defaultPrevented).toBe(true)
	expect(input.value).toBe('aXYZb')
	// caret should be after the inserted text
	expect(input.selectionStart).toBe(4)

	dispose()
})

await test('pasteText - <textarea> insertion replaces the current selection', async expect => {
	const dispose = render(
		<textarea use:ref={pasteText()}>hello world</textarea>,
	)
	await microtask()
	const ta = /** @type {HTMLTextAreaElement} */ ($('textarea'))
	ta.focus()
	// select "world"
	ta.setSelectionRange(6, 11)

	dispatchPaste(ta, 'pota')
	expect(ta.value).toBe('hello pota')

	dispose()
})

await test('pasteText - dispatches input event so listeners observe the change', async expect => {
	const events = []
	const dispose = render(
		<input
			type="text"
			value=""
			use:ref={pasteText()}
			on:input={e =>
				events.push(/** @type {HTMLInputElement} */ (e.target).value)
			}
		/>,
	)
	await microtask()
	const input = /** @type {HTMLInputElement} */ ($('input'))
	input.focus()
	input.setSelectionRange(0, 0)

	dispatchPaste(input, 'hello')
	expect(input.value).toBe('hello')
	expect(events).toEqual(['hello'])

	dispose()
})

await test('pasteText - HTML-formatted clipboard is ignored, only text/plain wins', async expect => {
	const dispose = render(
		<input type="text" value="" use:ref={pasteText()} />,
	)
	await microtask()
	const input = /** @type {HTMLInputElement} */ ($('input'))
	input.focus()
	input.setSelectionRange(0, 0)

	// Build a clipboard where text/html is rich but text/plain is
	// what we want pasted.
	const data = new DataTransfer()
	data.setData('text/plain', 'plain text')
	data.setData('text/html', '<b style="color:red">plain text</b>')
	const e = new ClipboardEvent('paste', {
		clipboardData: data,
		bubbles: true,
		cancelable: true,
	})
	input.dispatchEvent(e)

	expect(input.value).toBe('plain text')
	// raw HTML must not have leaked into the field
	expect(input.value.includes('<b')).toBe(false)

	dispose()
})

await test('pasteText - handler overrides default insertion', async expect => {
	const seen = []
	const dispose = render(
		<input
			type="text"
			value="untouched"
			use:ref={pasteText((text, e, node) => {
				seen.push({ text, prevented: e.defaultPrevented, node })
			})}
		/>,
	)
	await microtask()
	const input = /** @type {HTMLInputElement} */ ($('input'))
	input.focus()
	input.setSelectionRange(0, input.value.length)

	dispatchPaste(input, 'IGNORED')
	// handler ran with the plain text and the live event
	expect(seen.length).toBe(1)
	expect(seen[0].text).toBe('IGNORED')
	expect(seen[0].prevented).toBe(true)
	expect(seen[0].node).toBe(input)
	// default insertion did NOT run
	expect(input.value).toBe('untouched')

	dispose()
})

await test('pasteText - handler is cleaned up on dispose', async expect => {
	let calls = 0
	const dispose = render(
		<input type="text" value="" use:ref={pasteText(() => calls++)} />,
	)
	await microtask()
	const input = /** @type {HTMLInputElement} */ ($('input'))

	dispatchPaste(input, 'one')
	expect(calls).toBe(1)

	dispose()
	dispatchPaste(input, 'two')
	expect(calls).toBe(1)
})

// --- pasteFiles ------------------------------------------------------

await test('pasteFiles - fires handler with files and prevents default', async expect => {
	const seen = []
	const dispose = render(
		<div
			tabindex="0"
			use:ref={pasteFiles((files, e, node) => {
				seen.push({ files, prevented: e.defaultPrevented, node })
			})}
		/>,
	)
	await microtask()
	const div = $('div')

	const file = new File(['data'], 'pic.png', { type: 'image/png' })
	const e = dispatchPaste(div, '', [file])

	expect(seen.length).toBe(1)
	expect(seen[0].files.length).toBe(1)
	expect(seen[0].files[0]).toBe(file)
	expect(seen[0].prevented).toBe(true)
	expect(seen[0].node).toBe(div)
	// returned event also reflects the preventDefault
	expect(e.defaultPrevented).toBe(true)

	dispose()
})

await test('pasteFiles - handler is not called and default not prevented when only text is pasted', async expect => {
	let calls = 0
	const dispose = render(
		<div tabindex="0" use:ref={pasteFiles(() => calls++)} />,
	)
	await microtask()
	const div = $('div')

	const e = dispatchPaste(div, 'just text')
	expect(calls).toBe(0)
	expect(e.defaultPrevented).toBe(false)

	dispose()
})

await test('pasteFiles - hands all clipboard files to the handler', async expect => {
	/** @type {File[]} */
	let received = []
	const dispose = render(
		<div
			tabindex="0"
			use:ref={pasteFiles(files => {
				received = files
			})}
		/>,
	)
	await microtask()
	const div = $('div')

	const a = new File(['a'], 'a.txt', { type: 'text/plain' })
	const b = new File(['b'], 'b.txt', { type: 'text/plain' })
	dispatchPaste(div, '', [a, b])

	expect(received.length).toBe(2)
	expect(received[0]).toBe(a)
	expect(received[1]).toBe(b)

	dispose()
})

await test('pasteFiles - handler is cleaned up on dispose', async expect => {
	let calls = 0
	const dispose = render(
		<div tabindex="0" use:ref={pasteFiles(() => calls++)} />,
	)
	await microtask()
	const div = $('div')

	dispatchPaste(div, '', [
		new File(['a'], 'a.bin', { type: 'application/octet-stream' }),
	])
	expect(calls).toBe(1)

	dispose()
	dispatchPaste(div, '', [
		new File(['b'], 'b.bin', { type: 'application/octet-stream' }),
	])
	expect(calls).toBe(1)
})
