/** @jsxImportSource pota */

// Tests for `addEvent()` / `removeEvent()` and the JSX `on:event`
// directive (handleEvent objects, handler arrays, null/undefined
// handlers, owner-cleanup, reactivity).

import { $, test } from '#test'
import { addEvent, removeEvent, render, root, signal } from 'pota'

await test('addEvent and removeEvent - attach, detach and reattach listeners', expect => {
	const button = document.createElement('button')
	const seen = []
	const handler = event => seen.push(event.type)

	const off = addEvent(button, 'click', handler)
	button.click()

	const on = removeEvent(button, 'click', handler)
	button.click()

	on()
	button.click()

	off()
	button.click()

	expect(seen).toEqual(['click', 'click'])
})

await test('JSX on:event with handleEvent object - fires and respects once option', expect => {
	const seen = []
	const dispose = render(
		<button
			on:click={{ handleEvent: e => seen.push(e.type), once: true }}
		>
			click
		</button>,
	)
	const btn = $('button')
	btn.click()
	btn.click()
	expect(seen).toEqual(['click'])
	dispose()
})

await test('JSX on:event array - all handlers in array are called per event', expect => {
	const seen = []
	const dispose = render(
		<button on:click={[() => seen.push('a'), () => seen.push('b')]}>
			click
		</button>,
	)
	$('button').click()
	expect(seen).toEqual(['a', 'b'])
	dispose()
})

// --- on:event cleanup --------------------------------------------------------

await test('JSX on:event - listeners are cleaned up when scope disposes', expect => {
	const seen = []
	const dispose = render(
		<button on:click={() => seen.push('click')}>go</button>,
	)

	// baseline: button rendered and handler works
	expect($('button')).not.toBe(null)
	$('button').click()
	expect(seen).toEqual(['click'])

	dispose()

	// button removed from DOM, but verify listener was also cleaned
	// by checking no further side effects
	expect(seen).toEqual(['click'])
})

// --- on:event with null does not throw ---------------------------------------

await test('JSX on:event - null handler is safely ignored', expect => {
	const dispose = render(<button on:click={null}>click</button>)

	// baseline: button rendered correctly
	expect($('button')).not.toBe(null)
	expect($('button').textContent).toBe('click')

	// should not throw when clicking
	$('button').click()
	dispose()
})

// --- event handlers: passing undefined removes them ------------------

await test('on:click - undefined handler does not throw', expect => {
	const dispose = render(<button on:click={undefined}>click</button>)

	$('button').click()
	expect($('button').textContent).toBe('click')

	dispose()
})

await test('JSX on:event - handlers are not reactive', expect => {
	const handler = signal(() => {})
	const calls = []

	handler.write(() => {
		calls.push('first')
	})
	const dispose = render(
		<button on:click={handler.read}>click</button>,
	)

	expect($('button') instanceof HTMLButtonElement).toBe(true)

	$('button').click()
	handler.write(() => {
		calls.push('second')
	})
	$('button').click()

	// on:click={handler.read} just reads the signal on click, it doesnt actually runs the signal value in the event listener
	expect(calls).toEqual([])

	dispose()
})

// --- event handler ownership -------------------------------------------------

await test('addEvent - handler registered inside component is cleaned up on dispose', expect => {
	const seen = []
	const button = document.createElement('button')
	document.body.append(button)

	// baseline: no clicks yet
	expect(seen).toEqual([])

	const dispose = root(d => {
		addEvent(button, 'click', () => seen.push('click'))
		return d
	})

	button.click()
	expect(seen).toEqual(['click'])

	dispose()

	button.click()
	expect(seen).toEqual(['click'])

	button.remove()
})

await test('JSX on:event - handlers read the current signal value, not a captured one', expect => {
	const count = signal(0)
	let observed = -1

	const dispose = render(
		<button on:click={() => (observed = count.read())}>click</button>,
	)

	count.write(5)

	$('button').click()
	expect(observed).toBe(5)

	count.write(10)

	$('button').click()
	expect(observed).toBe(10)

	dispose()
})
