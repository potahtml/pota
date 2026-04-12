/** @jsxImportSource pota */

// Cross-cutting developer expectations: timing/order surprises,
// attribute-vs-property semantics, immediate Suspense behavior,
// hidden-but-mounted Collapse state, and reactive-pitfall patterns.
import { $, $$, body, microtask, test } from '#test'

import { ready, render, signal, memo, effect, root, syncEffect, cleanup, batch } from 'pota'
import { Collapse, Suspense } from 'pota/components'

await test('expectations - render inserts DOM synchronously, ref is immediate, and connected/ready wait for the next microtask', async expect => {
	const seen = []

	function Widget() {
		ready(() => {
			seen.push('ready:' + $('p')?.textContent)
		})

		return (
			<p
				use:ref={node => seen.push('ref:' + node.textContent)}
				use:connected={node =>
					seen.push('connected:' + node.textContent)
				}
			>
				hello
			</p>
		)
	}

	const dispose = render(<Widget />)

	expect(body()).toBe('<p>hello</p>')
	expect(seen).toEqual(['ref:hello'])

	await microtask()

	expect(seen).toEqual([
		'ref:hello',
		'connected:hello',
		'ready:hello',
	])

	dispose()
})

await test('expectations - plain props default to attributes, so prop:innerHTML is required for DOM content writes', expect => {
	const dispose = render(
		<>
			<div innerHTML="<b>attribute only</b>" />
			<div prop:innerHTML="<b>real content</b>" />
		</>,
	)

	const [attributeDiv, propertyDiv] = $$('div')

	expect(attributeDiv.innerHTML).toBe('')
	expect(attributeDiv.getAttribute('innerhtml')).toBe(
		'<b>attribute only</b>',
	)

	expect(propertyDiv.innerHTML).toBe('<b>real content</b>')
	expect(propertyDiv.hasAttribute('innerhtml')).toBe(false)

	dispose()
})

await test('expectations - Suspense shows sync children immediately but shows fallback immediately when a promise is present', async expect => {
	const disposeSync = render(
		<Suspense fallback={<p>loading</p>}>
			<p>sync child</p>
		</Suspense>,
	)

	expect(body()).toBe('<p>sync child</p>')

	disposeSync()

	const asyncChild = new Promise(resolve => {
		setTimeout(() => resolve(<p>async child</p>), 100)
	})

	const disposeAsync = render(
		<Suspense fallback={<p>loading</p>}>{asyncChild}</Suspense>,
	)

	expect(body()).toBe('<p>loading</p>')

	await asyncChild

	expect(body()).toBe('<p>async child</p>')

	disposeAsync()
})

await test('expectations - Collapse hides output without unmounting uncontrolled child state', expect => {
	const visible = signal(true)

	const dispose = render(
		<Collapse when={visible.read}>
			<input
				id="field"
				value="start"
			/>
		</Collapse>,
	)

	const input = document.getElementById('field')
	input.value = 'typed'

	const collapse = document.getElementsByTagName('pota-collapse')[0]

	// showing
	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')

	visible.write(false)

	// empty
	expect(collapse.shadowRoot.innerHTML).toBe('')

	expect(document.getElementById('field')).toBe(input)
	expect(input.value).toBe('typed')

	visible.write(true)

	expect(collapse.shadowRoot.innerHTML).toBe('<slot></slot>')
	expect(document.getElementById('field')).toBe(input)
	expect(document.getElementById('field').value).toBe('typed')

	dispose()
})

// --- reactive pitfalls: closing over a signal value vs reading it --------

await test('expectations - reading a signal outside JSX captures the value at render time', expect => {
	const count = signal(1)

	// wrong way: snapshot taken at JSX construction
	const dispose = render(<p>static: {count.read()}</p>)

	expect(body()).toBe('<p>static: 1</p>')

	count.write(2)

	// value is NOT reactive — still shows 1
	expect(body()).toBe('<p>static: 1</p>')

	dispose()
})

await test('expectations - passing a signal directly as a child makes it reactive', expect => {
	const count = signal(1)

	// correct way: the signal reader accessor is passed in
	const dispose = render(<p>reactive: {count.read}</p>)

	expect(body()).toBe('<p>reactive: 1</p>')

	count.write(2)

	// value updates in place
	expect(body()).toBe('<p>reactive: 2</p>')

	dispose()
})

// --- on:* event handlers keep seeing fresh signal values ----------------

await test('expectations - event handlers read the current signal value, not a captured one', expect => {
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

// --- memo only recomputes when its real dependencies change --------------

await test('expectations - memo recomputes only when its tracked dependencies change', expect => {
	const a = signal(1)
	const b = signal(10)
	let computations = 0

	// memo reads only `a`
	const doubled = memo(() => {
		computations++
		return a.read() * 2
	})

	expect(doubled()).toBe(2)
	expect(computations).toBe(1)

	// writing b does not trigger the memo
	b.write(99)
	expect(doubled()).toBe(2)
	expect(computations).toBe(1)

	// writing a does trigger the memo
	a.write(5)
	expect(doubled()).toBe(10)
	expect(computations).toBe(2)
})

// --- refs assigned synchronously right at element creation ---------------

await test('expectations - a use:ref callback receives the real DOM element on the same tick as render', expect => {
	let captured = null

	const dispose = render(<p use:ref={node => (captured = node)}>hi</p>)

	// the element exists and is the one in the document
	expect(captured).toBe($('p'))
	expect(captured.textContent).toBe('hi')

	dispose()
})

// --- effect cleanup runs in LIFO order before the next run ---------------

await test('expectations - an effect cleanup runs before the next invocation, not after', async expect => {
	const trigger = signal(0)
	const order = []

	const disposeRoot = root(dispose => {
		effect(() => {
			order.push('effect:' + trigger.read())
			cleanup(() => {
				order.push('cleanup:' + trigger.read())
			})
		})
		return dispose
	})

	// effect is deferred (not sync), wait one macrotask
	await microtask()
	await microtask()

	order.length = 0 // ignore initial run timing differences

	trigger.write(1)
	await microtask()
	await microtask()

	// after the run: cleanup from previous run, then the new run
	expect(order[0]).toBe('cleanup:1')
	expect(order[1]).toBe('effect:1')

	disposeRoot()
})

// --- disposing the root removes the DOM ----------------------------------

await test('expectations - disposing a render call fully removes its rendered nodes', expect => {
	const dispose = render(
		<div>
			<p>one</p>
			<p>two</p>
		</div>,
	)

	expect($('div')).not.toBe(null)
	expect($$('p').length).toBe(2)

	dispose()

	expect($('div')).toBe(null)
	expect($$('p').length).toBe(0)
})

// --- spread of reactive props updates the DOM ----------------------------

await test('expectations - spread props containing a signal stay reactive after render', expect => {
	const id = signal('first')

	// In pota the reactive value inside a spread is a function
	// (the reader accessor), not a getter: assignProps passes the
	// value straight to withValue, which wraps functions in effects.
	const props = {
		id: id.read,
		class: 'static',
	}

	const dispose = render(<p {...props}>hi</p>)

	expect($('p').getAttribute('id')).toBe('first')
	expect($('p').className).toBe('static')

	id.write('second')
	expect($('p').getAttribute('id')).toBe('second')

	dispose()
})

// --- syncEffect runs before user effects in the same flush ---------------

await test('expectations - syncEffect runs before effect within the same flush, both coalesce across a batch', expect => {
	const count = signal(0)
	const log = []

	const dispose = root(dispose => {
		syncEffect(() => {
			log.push('sync:' + count.read())
		})
		effect(() => {
			log.push('user:' + count.read())
		})
		return dispose
	})

	// each ran immediately at creation, in construction order
	expect(log).toEqual(['sync:0', 'user:0'])

	log.length = 0

	// a single write triggers both observers; the flush queue runs
	// non-user (syncEffect) before user (effect)
	count.write(1)
	expect(log).toEqual(['sync:1', 'user:1'])

	log.length = 0

	// multiple writes inside a batch coalesce — each observer
	// runs exactly once with the final value, preserving the
	// sync-before-user order
	batch(() => {
		count.write(2)
		count.write(3)
		count.write(4)
	})
	expect(log).toEqual(['sync:4', 'user:4'])

	dispose()
})

// --- functional children re-run on each signal change -------------------

await test('expectations - function child runs once per signal change, not per DOM append', expect => {
	const count = signal(0)
	let calls = 0

	const dispose = render(
		<p>
			{() => {
				calls++
				return count.read()
			}}
		</p>,
	)

	expect(calls).toBe(1)
	expect(body()).toBe('<p>0</p>')

	count.write(1)
	expect(calls).toBe(2)
	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(calls).toBe(3)

	dispose()
})
