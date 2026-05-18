/** @jsxImportSource pota */
// Tests for pota/use/keyboard: shortcut, globalShortcut,
// submitOnCtrlEnter ref factories.

import { microtask, test, $ } from '#test'

import { render } from 'pota'
import {
	globalShortcut,
	shortcut,
	submitOnCtrlEnter,
} from 'pota/use/keyboard'

const isMac = /mac/i.test(navigator.platform)

await test('keyboard - shortcut fires on matching chord and prevents default', async expect => {
	const calls = []
	const dispose = render(
		<input
			id="k"
			use:ref={shortcut('ctrl+s', (e, node) => {
				calls.push({ key: e.key, id: node.id })
			})}
		/>,
		document.body,
	)

	await microtask()

	const input = $('#k')
	const event = new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		key: 's',
		ctrlKey: true,
	})
	input.dispatchEvent(event)

	expect(calls.length).toBe(1)
	expect(calls[0]).toEqual({ key: 's', id: 'k' })
	expect(event.defaultPrevented).toBe(true)

	dispose()
})

await test('keyboard - shortcut ignores non-matching modifier combos', async expect => {
	const calls = []
	const dispose = render(
		<input
			id="k2"
			use:ref={shortcut('ctrl+s', () => calls.push(1))}
		/>,
		document.body,
	)

	await microtask()

	const input = $('#k2')
	// just `s`, no ctrl
	input.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key: 's' }),
	)
	// ctrl+shift+s — shift not requested
	input.dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 's',
			ctrlKey: true,
			shiftKey: true,
		}),
	)

	expect(calls).toEqual([])

	dispose()
})

await test('keyboard - globalShortcut listens on document', async expect => {
	const calls = []
	const dispose = render(
		<div use:ref={globalShortcut('ctrl+k', () => calls.push(1))} />,
		document.body,
	)

	await microtask()

	document.body.dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 'k',
			ctrlKey: true,
		}),
	)

	expect(calls).toEqual([1])

	dispose()

	// after dispose, shortcut should not fire
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 'k',
			ctrlKey: true,
		}),
	)
	expect(calls).toEqual([1])
})

await test('keyboard - submitOnCtrlEnter fires on Ctrl/Cmd+Enter', async expect => {
	const calls = []
	const dispose = render(
		<textarea
			id="ta"
			use:ref={submitOnCtrlEnter(() => calls.push(1))}
		/>,
		document.body,
	)

	await microtask()

	const ta = $('#ta')
	ta.dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 'Enter',
			ctrlKey: !isMac,
			metaKey: isMac,
		}),
	)

	expect(calls).toEqual([1])

	dispose()
})

await test('keyboard - shortcut accepts `mod` alias', async expect => {
	const calls = []
	const dispose = render(
		<input
			id="mod"
			use:ref={shortcut('mod+a', () => calls.push(1))}
		/>,
		document.body,
	)

	await microtask()

	$('#mod').dispatchEvent(
		new KeyboardEvent('keydown', {
			bubbles: true,
			key: 'a',
			ctrlKey: !isMac,
			metaKey: isMac,
		}),
	)

	expect(calls).toEqual([1])

	dispose()
})
