/** @jsxImportSource pota */
// Tests for pota/use/keyboard: shortcut, globalShortcut,
// submitOnCtrlEnter ref factories.

import { microtask, test, $ } from '#test'

import { render, syncEffect } from 'pota'
import {
	globalShortcut,
	keysHeld,
	shortcut,
	submitOnCtrlEnter,
	useKeyHeld,
} from 'pota/use/keyboard'

const keydown = (key, target = window) =>
	target.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, key }),
	)
const keyup = (key, target = window) =>
	target.dispatchEvent(
		new KeyboardEvent('keyup', { bubbles: true, key }),
	)
// reset all module-level held state between tests
const resetHeld = () => window.dispatchEvent(new Event('blur'))

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

await test('keyboard - useKeyHeld flips reactively on keydown/keyup', async expect => {
	const held = useKeyHeld('a')
	expect(held()).toBe(false)

	keydown('a')
	expect(held()).toBe(true)
	expect(keysHeld().has('a')).toBe(true)

	keyup('a')
	expect(held()).toBe(false)
	expect(keysHeld().has('a')).toBe(false)

	resetHeld()
})

await test('keyboard - useKeyHeld is case-insensitive and reactive in effect', async expect => {
	const transitions = []
	const held = useKeyHeld('W')
	syncEffect(() => transitions.push(held()))

	expect(transitions).toEqual([false])

	keydown('w')
	expect(transitions).toEqual([false, true])

	// OS key-repeat: extra keydowns must not re-fire the signal
	keydown('w')
	keydown('w')
	expect(transitions).toEqual([false, true])

	keyup('w')
	expect(transitions).toEqual([false, true, false])

	resetHeld()
})

await test('keyboard - useKeyHeld ignores keydown while editable focused but honors keyup', async expect => {
	const held = useKeyHeld('q')

	const dispose = render(<input id="ed" />, document.body)
	await microtask()

	const input = $('#ed')
	input.focus()
	expect(document.activeElement).toBe(input)

	keydown('q')
	expect(held()).toBe(false)
	expect(keysHeld().has('q')).toBe(false)

	input.blur()
	// keyup must still clear any prior held state — simulate a key
	// that was already held before focus moved into the editable.
	keydown('q')
	expect(held()).toBe(true)
	// move focus back into an input and release: keyup is unconditional
	input.focus()
	keyup('q')
	expect(held()).toBe(false)

	dispose()
	resetHeld()
})

await test('keyboard - window blur clears all held keys', async expect => {
	const a = useKeyHeld('a')
	const b = useKeyHeld('b')

	keydown('a')
	keydown('b')
	expect(a()).toBe(true)
	expect(b()).toBe(true)
	expect(keysHeld().size).toBe(2)

	window.dispatchEvent(new Event('blur'))
	expect(a()).toBe(false)
	expect(b()).toBe(false)
	expect(keysHeld().size).toBe(0)
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
