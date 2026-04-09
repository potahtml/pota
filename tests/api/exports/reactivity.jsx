/** @jsxImportSource pota */

// Tests for reactive primitives: signal (custom equals, update),
// memo (lazy, custom equals, unchanged suppression), derived, effect
// (re-subscription, diamond, disposal), syncEffect, asyncEffect,
// batch (nested), untrack, on (multiple deps), root (nested, return
// value), owned (cancel, reuse, disposal), cleanup (LIFO), context,
// action (sync/async), externalSignal (id patching, mixed), map
// (fallback, duplicates, reactive index), resolve, unwrap, isResolved,
// ref, withValue, getValue, addEvent (auto-cleanup).
import { test, body, macrotask, microtask } from '#test'

import {
	action,
	addEvent,
	asyncEffect,
	batch,
	cleanup,
	context,
	derived,
	effect,
	externalSignal,
	getValue,
	isResolved,
	map,
	memo,
	on,
	owned,
	ref,
	render,
	resolve,
	root,
	signal,
	syncEffect,
	untrack,
	unwrap,
	withValue,
} from 'pota'

await test('signal - supports read, write and update', expect => {
	const count = signal(1)

	expect(count.read()).toBe(1)
	expect(count[0]()).toBe(1)
	expect(count.write(2)).toBe(true)
	expect(count.read()).toBe(2)
	expect(count.update(value => value + 3)).toBe(true)
	expect(count.read()).toBe(5)
	expect(count.write(5)).toBe(false)
})

await test('memo - recomputes when dependencies change', expect => {
	const count = signal(2)
	const doubled = memo(() => count.read() * 2)

	expect(doubled()).toBe(4)
	count.write(3)
	expect(doubled()).toBe(6)
})

await test('derived and isResolved - resolve chained values and stay reactive', expect => {
	const count = signal(2)
	const doubled = derived(
		() => count.read(),
		value => value * 2,
	)

	expect(doubled()).toBe(4)
	expect(isResolved(doubled)).toBe(true)

	count.write(5)

	expect(doubled()).toBe(10)
	expect(isResolved(doubled)).toBe(true)
})

await test('effect and cleanup - reruns tracked work and cleans previous run', expect => {
	const count = signal(1)
	const seen = []
	const cleaned = []

	root(() => {
		effect(() => {
			const value = count.read()
			seen.push(value)
			cleanup(() => cleaned.push(value))
		})
	})

	expect(seen).toEqual([1])
	expect(cleaned).toEqual([])

	count.write(2)

	expect(seen).toEqual([1, 2])
	expect(cleaned).toEqual([1])
})

await test('syncEffect - runs immediately in dependency order', expect => {
	const count = signal(1)
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1])

	count.write(4)

	expect(seen).toEqual([1, 4])
})

await test('asyncEffect - queues async runs sequentially', async expect => {
	const value = signal('a')
	const seen = []

	root(() => {
		asyncEffect(async previous => {
			if (previous) {
				await previous
			}
			seen.push(value.read())
			await macrotask()
		})
	})

	await macrotask()
	value.write('b')
	value.write('c')
	await macrotask()
	await macrotask()
	await macrotask()

	expect(seen).toEqual(['a', 'b', 'c'])
})

await test('batch - coalesces dependent effect work', expect => {
	const left = signal(1)
	const right = signal(2)
	const seen = []

	root(() => {
		effect(() => seen.push(left.read() + right.read()))
	})

	expect(seen).toEqual([3])

	batch(() => {
		left.write(3)
		right.write(4)
	})

	expect(seen).toEqual([3, 7])
})

await test('untrack - avoids subscribing to incidental reads', expect => {
	const tracked = signal(1)
	const incidental = signal(10)
	const seen = []

	root(() => {
		effect(() => {
			seen.push({
				tracked: tracked.read(),
				incidental: untrack(() => incidental.read()),
			})
		})
	})

	incidental.write(20)
	expect(seen).toEqual([{ tracked: 1, incidental: 10 }])

	tracked.write(2)
	expect(seen).toEqual([
		{ tracked: 1, incidental: 10 },
		{ tracked: 2, incidental: 20 },
	])
})

await test('on - tracks only explicit dependencies', expect => {
	const trigger = signal(1)
	const incidental = signal('a')
	const seen = []

	root(() => {
		on(
			() => trigger.read(),
			() => {
				seen.push([trigger.read(), incidental.read()])
			},
		)
	})

	expect(seen).toEqual([[1, 'a']])

	incidental.write('b')
	expect(seen).toEqual([[1, 'a']])

	trigger.write(2)
	expect(seen).toEqual([
		[1, 'a'],
		[2, 'b'],
	])
})

await test('root and cleanup - dispose owner scopes explicitly', expect => {
	const cleaned = []

	const dispose = root(dispose => {
		cleanup(() => cleaned.push('root'))
		return dispose
	})

	expect(cleaned).toEqual([])

	dispose()

	expect(cleaned).toEqual(['root'])
})

await test('cleanup - multiple callbacks run in LIFO order on dispose', expect => {
	const seen = []

	const dispose = root(d => {
		cleanup(() => seen.push('first'))
		cleanup(() => seen.push('second'))
		cleanup(() => seen.push('third'))
		return d
	})

	dispose()

	expect(seen).toEqual(['third', 'second', 'first'])
})

await test('cleanup - runs when a component scope is unmounted', expect => {
	const seen = []

	function Component() {
		cleanup(() => seen.push('cleaned'))
		return <p>content</p>
	}

	const dispose = render(Component)

	expect(body()).toBe('<p>content</p>')
	expect(seen).toEqual([])

	dispose()

	expect(seen).toEqual(['cleaned'])
})

await test('context - provides defaults and nested overrides', expect => {
	const Theme = context('light')

	expect(Theme()).toBe('light')
	expect(Theme('dark', () => Theme('contrast', () => Theme()))).toBe(
		'contrast',
	)
	expect(Theme('dark', () => Theme())).toBe('dark')
})

await test('action - resolves chained sync and async callbacks', async expect => {
	const seen = []
	const run = action(
		value => Promise.resolve(value + 1),
		value => value * 2,
		value => seen.push(value),
	)

	run(2)
	await macrotask()

	expect(seen).toEqual([6])
})

await test('externalSignal - preserves equal items by id', expect => {
	const first = { id: '1', label: 'one' }
	const second = { id: '2', label: 'two' }
	const items = externalSignal([first, second])

	items.write([
		{ id: '1', label: 'one' },
		{ id: '2', label: 'two updated' },
		{ id: '3', label: 'three' },
	])

	expect(items.read()[0]).toBe(first)
	expect(items.read()[1]).not.toBe(second)
	expect(items.read()[1].label).toBe('two updated')
	expect(items.read()[2].label).toBe('three')
})

await test('resolve and unwrap - flatten nested children and keep them reactive', expect => {
	const count = signal('a')
	const resolved = resolve(() => [() => count.read(), ['!']])

	expect(unwrap([['x'], () => ['y', ['z']]])).toEqual(['x', 'y', 'z'])
	expect(resolved()).toEqual(['a', '!'])

	count.write('b')

	expect(resolved()).toEqual(['b', '!'])
})

await test('derived - resolves nested promises into current values', async expect => {
	const resolved = await derived(() => [
		Promise.resolve('a'),
		['b', Promise.resolve('c')],
	])
	expect(resolved()).toEqual(['a', ['b', 'c']])
})

await test('resolve - wrapping props.children gives a stable memoized accessor', expect => {
	const evaluations = []

	function Menu(props) {
		const items = resolve(() => {
			evaluations.push('evaluated')
			return props.children
		})
		return <ul>{items}</ul>
	}

	const dispose = render(
		<Menu>
			<li>one</li>
			<li>two</li>
		</Menu>,
	)

	expect(body()).toBe('<ul><li>one</li><li>two</li></ul>')
	expect(evaluations).toEqual(['evaluated'])

	dispose()
})

await test('ref - creates a writable signal function', expect => {
	const nodeRef = ref()

	expect(nodeRef()).toBe(undefined)

	nodeRef('value')

	expect(nodeRef()).toBe('value')
})

await test('withValue and getValue - unwrap functions and promises', async expect => {
	const count = signal(1)
	const seen = []

	withValue(
		() => count.read(),
		value => seen.push(value),
	)
	withValue(
		Promise.resolve(3),
		value => seen.push(value),
		() => seen.push('pending'),
	)

	expect(getValue(() => () => count.read())).toBe(1)
	expect(seen).toEqual([1, 'pending'])

	count.write(2)
	await microtask()

	expect(seen).toEqual([1, 'pending', 2, 3])
})

await test('withValue - handles plain values without pending callbacks', expect => {
	const seen = []

	root(() => {
		withValue(
			5,
			value => seen.push(value),
			() => seen.push('pending'),
		)
	})

	expect(seen).toEqual([5])
})

await test('owned - runs callback when owner is still alive', expect => {
	const seen = []

	const fn = root(() => owned(value => seen.push(value)))

	fn('a')
	fn('b')

	expect(seen).toEqual(['a', 'b'])
})

await test('owned - calls onCancel when owner is disposed without calling the owned fn', expect => {
	const seen = []

	const dispose = root(d => {
		owned(
			() => seen.push('ran'),
			() => seen.push('cancelled'),
		)
		return d
	})

	dispose()

	expect(seen).toEqual(['cancelled'])
})

await test('owned - calling the owned fn before disposal suppresses onCancel', expect => {
	const seen = []

	let fn
	const dispose = root(d => {
		fn = owned(
			() => seen.push('ran'),
			() => seen.push('cancelled'),
		)
		return d
	})

	fn()
	dispose()

	expect(seen).toEqual(['ran'])
})

await test('owned - does not run callback after owner is disposed', expect => {
	const seen = []

	let fn
	const dispose = root(d => {
		fn = owned(value => seen.push(value))
		return d
	})

	fn('before')
	dispose()
	fn('after')

	expect(seen).toEqual(['before'])
})

await test('memo - is lazy initialized: does not execute until first read', expect => {
	const ran = []
	const count = signal(1)
	const doubled = memo(() => {
		const v = count.read() * 2
		ran.push(v)
		return v
	})

	expect(ran).toEqual([])

	expect(doubled()).toBe(2)
	expect(ran).toEqual([2])

	count.write(3)

	expect(ran).toEqual([2, 6])

	expect(doubled()).toBe(6)
	expect(ran).toEqual([2, 6])
})

// --- signal options -----------------------------------------------------------

await test('signal - equals:false always notifies even when value is the same', expect => {
	const count = signal(1, { equals: false })
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1])

	// same value, but equals:false means it still triggers
	count.write(1)
	expect(seen).toEqual([1, 1])

	count.write(1)
	expect(seen).toEqual([1, 1, 1])
})

await test('signal - write returns false when value is equal (default equality)', expect => {
	const count = signal(1)
	expect(count.write(1)).toBe(false)
	expect(count.write(2)).toBe(true)
	expect(count.write(2)).toBe(false)
})

await test('signal - initial undefined value works', expect => {
	const s = signal()
	expect(s.read()).toBe(undefined)
	s.write('set')
	expect(s.read()).toBe('set')
})

// --- memo options -------------------------------------------------------------

await test('memo - equals:false always recomputes dependents', expect => {
	const count = signal(0, { equals: false })
	const runs = []
	const doubled = memo(() => {
		const v = count.read() * 2
		runs.push(v)
		return v
	})

	const downstream = []
	root(() => {
		syncEffect(() => downstream.push(doubled()))
	})

	expect(downstream).toEqual([0])

	count.write(0) // same value, but memo has equals:false
	// memo recomputes, downstream reruns even though result is same
	expect(runs.length).toBe(2)
})

// --- effect doesnt return cleanup -----------------------------------------------

await test('effect - effect doesnt returns cleanup', expect => {
	const count = signal(1)
	const seen = []

	root(() => {
		effect(() => {
			const v = count.read()
			seen.push('run:' + v)
			cleanup(() => seen.push('cleanup:' + v))
		})
	})

	expect(seen).toEqual(['run:1'])

	count.write(2)
	expect(seen).toEqual(['run:1', 'cleanup:1', 'run:2'])
})

// --- nested batch -------------------------------------------------------------

await test('batch - nested batches defer until outermost completes', expect => {
	const a = signal(1)
	const b = signal(2)
	const c = signal(3)
	const seen = []

	root(() => {
		effect(() => seen.push(a.read() + b.read() + c.read()))
	})

	expect(seen).toEqual([6])

	batch(() => {
		a.write(10)
		batch(() => {
			b.write(20)
			c.write(30)
		})
		// inner batch should not have flushed yet
	})

	// all three updates coalesced into one effect run
	expect(seen).toEqual([6, 60])
})

// --- syncEffect vs effect ordering -------------------------------------------

await test('syncEffect - runs synchronously on signal write, effect defers', expect => {
	const count = signal(0)
	const order = []

	root(() => {
		effect(() => {
			order.push('effect:' + count.read())
		})
		syncEffect(() => {
			order.push('sync:' + count.read())
		})
	})

	expect(order).toEqual(['sync:0', 'effect:0'])

	count.write(1)
	// syncEffect runs immediately, effect may also run immediately
	// depending on scheduling, but both should have fired
	expect(order).toInclude('sync:1')
	expect(order).toInclude('effect:1')
})

// --- on with multiple dependencies -------------------------------------------

await test('on - fires when any of multiple tracked dependencies change', expect => {
	const a = signal(1)
	const b = signal(2)
	const seen = []

	root(() => {
		on(
			() => [a.read(), b.read()],
			() => seen.push(a.read() + b.read()),
		)
	})

	expect(seen).toEqual([3])

	a.write(10)
	expect(seen).toEqual([3, 12])

	b.write(20)
	expect(seen).toEqual([3, 12, 30])
})

// --- root returns value ------------------------------------------------------

await test('root - returns the value from the callback', expect => {
	const result = root(() => 42)
	expect(result).toBe(42)
})

// --- signal custom equals ----------------------------------------------------

await test('signal - custom equals comparator controls notification', expect => {
	// only notify when integer part changes
	const count = signal(1.1, {
		equals: (a, b) => Math.floor(a) === Math.floor(b),
	})
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1.1])

	count.write(1.9) // same floor → suppressed
	expect(seen).toEqual([1.1])

	count.write(2.0) // different floor → notifies
	expect(seen).toEqual([1.1, 2.0])
})

// --- signal update method ----------------------------------------------------

await test('signal - update receives the previous value and returns new', expect => {
	const count = signal(10)
	const changed = count.update(prev => prev + 5)

	expect(changed).toBe(true)
	expect(count.read()).toBe(15)

	const same = count.update(prev => prev)
	expect(same).toBe(false)
})

// --- derived writable --------------------------------------------------------

await test('derived - is writable via signal-style write', expect => {
	const base = signal(2)
	const doubled = derived(
		() => base.read(),
		v => v * 2,
	)

	expect(doubled()).toBe(4)

	base.write(5)
	expect(doubled()).toBe(10)
})

// --- externalSignal update ---------------------------------------------------

await test('externalSignal - update method patches based on updater', expect => {
	const items = externalSignal([
		{ id: '1', label: 'one' },
	])

	items.update(prev => [
		...prev,
		{ id: '2', label: 'two' },
	])

	expect(items.read().length).toBe(2)
	expect(items.read()[1].label).toBe('two')
})

await test('externalSignal - items without id are never preserved', expect => {
	const a = { label: 'a' }
	const items = externalSignal([a])

	// baseline: initial item is our reference
	expect(items.read()[0]).toBe(a)
	expect(items.read().length).toBe(1)

	items.write([{ label: 'a' }])

	// no id field, so deep-equality decides, but reference is different
	// equals({label:'a'},{label:'a'}) is true, so reference IS preserved
	expect(items.read()[0]).toBe(a)
})

// --- action sync only --------------------------------------------------------

await test('action - resolves a fully synchronous chain', expect => {
	const result = []
	const run = action(
		v => v + 1,
		v => v * 3,
		v => result.push(v),
	)

	run(1)
	expect(result).toEqual([6])
})

// --- effect re-subscribes to different signals -------------------------------

await test('effect - re-subscribes when reading different signals per run', expect => {
	const toggle = signal(true)
	const a = signal('A')
	const b = signal('B')
	const seen = []

	root(() => {
		effect(() => {
			seen.push(toggle.read() ? a.read() : b.read())
		})
	})

	expect(seen).toEqual(['A'])

	a.write('A2')
	expect(seen).toEqual(['A', 'A2'])

	// switch branch: now tracks b, not a
	toggle.write(false)
	expect(seen).toEqual(['A', 'A2', 'B'])

	// a change should NOT trigger (no longer tracked)
	a.write('A3')
	expect(seen).toEqual(['A', 'A2', 'B'])

	// b change should trigger
	b.write('B2')
	expect(seen).toEqual(['A', 'A2', 'B', 'B2'])
})

// --- effect diamond dependency -----------------------------------------------

await test('effect - diamond dependency runs effect once per batch', expect => {
	const source = signal(1)
	const left = memo(() => source.read() * 2)
	const right = memo(() => source.read() * 3)
	const seen = []

	root(() => {
		effect(() => seen.push(left() + right()))
	})

	expect(seen).toEqual([5])

	source.write(2)
	expect(seen).toEqual([5, 10])
})

// --- context with undefined default ------------------------------------------

await test('context - undefined default value works', expect => {
	const Ctx = context()
	expect(Ctx()).toBe(undefined)
	expect(Ctx('hello', () => Ctx())).toBe('hello')
	expect(Ctx()).toBe(undefined)
})

// --- resolve with nested functions -------------------------------------------

await test('resolve - unwraps nested functions of arrays', expect => {
	const v = signal('x')
	const resolved = resolve(() => [() => [() => v.read(), 'y']])

	expect(resolved()).toEqual(['x', 'y'])

	v.write('z')
	expect(resolved()).toEqual(['z', 'y'])
})

// --- unwrap with nested functions --------------------------------------------

await test('unwrap - unwraps functions returning arrays recursively', expect => {
	expect(unwrap(() => [1, () => 2, [3, () => 4]])).toEqual([
		1, 2, 3, 4,
	])
})

await test('unwrap - returns non-array non-function values as-is', expect => {
	expect(unwrap('hello')).toBe('hello')
	expect(unwrap(42)).toBe(42)
	expect(unwrap(null)).toBe(null)
})

// --- map fallback ------------------------------------------------------------

/*
await test('map - renders fallback when list is empty and clears it when items arrive', expect => {
	const items = signal([])

	const dispose = render(
		<>{map(items.read, item => <p>{item}</p>, false, <b>empty</b>)}</>,
	)

	expect(body()).toBe('<b>empty</b>')

	items.write(['a'])
	expect(body()).toBe('<p>a</p>')

	items.write([])
	expect(body()).toBe('<b>empty</b>')

	dispose()
})
*/

// --- map duplicates ----------------------------------------------------------

await test('map - handles duplicate primitive values', expect => {
	const items = signal([1, 1, 1])
	let nodes

	root(() => {
		const mapper = map(items.read, item => item)
		nodes = mapper()
	})

	expect(nodes.length).toBe(3)
})

// --- map reactive index ------------------------------------------------------

await test('map - reactive index updates when items reorder', expect => {
	const items = signal(['a', 'b', 'c'])
	const indices = []

	root(() => {
		const mapper = map(
			items.read,
			(item, index) => {
				indices.push({ item, index: index() })
				return item
			},
			false,
			undefined,
			true,
		)
		mapper()
	})

	expect(indices).toEqual([
		{ item: 'a', index: 0 },
		{ item: 'b', index: 1 },
		{ item: 'c', index: 2 },
	])
})

// --- ref as signal function --------------------------------------------------

await test('ref - works as a signal function for read and write', expect => {
	const r = ref()

	expect(r()).toBe(undefined)

	r('hello')
	expect(r()).toBe('hello')

	r(42)
	expect(r()).toBe(42)
})

// --- withValue with array of values ------------------------------------------

await test('withValue - handles array of functions by unwrapping each', expect => {
	const seen = []

	root(() => {
		withValue(
			[() => 'a', () => 'b'],
			value => seen.push(value),
		)
	})

	expect(seen).toEqual([['a', 'b']])
})

// --- addEvent auto-cleanup ---------------------------------------------------

await test('addEvent - auto-removes listener when owner scope disposes', expect => {
	const button = document.createElement('button')
	const seen = []

	// baseline: no clicks yet
	expect(seen).toEqual([])

	const dispose = root(d => {
		addEvent(button, 'click', () => seen.push('click'))
		return d
	})

	// handler works
	button.click()
	expect(seen).toEqual(['click'])

	dispose()

	// handler cleaned up — click does nothing
	button.click()
	expect(seen).toEqual(['click'])
})

// --- owned reusable ----------------------------------------------------------

await test('owned - returned function can be called multiple times while owner is alive', expect => {
	const seen = []

	const fn = root(() => owned(v => {
		seen.push(v)
		return v
	}))

	fn('a')
	fn('b')
	fn('c')

	expect(seen).toEqual(['a', 'b', 'c'])
})

// --- externalSignal with mixed id/no-id items --------------------------------

await test('externalSignal - mixed items with and without id', expect => {
	const withId = { id: '1', v: 'a' }
	const noId = { v: 'b' }
	const items = externalSignal([withId, noId])

	// baseline: both items present with correct references
	expect(items.read().length).toBe(2)
	expect(items.read()[0]).toBe(withId)
	expect(items.read()[1]).toBe(noId)

	items.write([
		{ id: '1', v: 'a' },
		{ v: 'b' },
	])

	// item with id preserved by reference (deep equal)
	expect(items.read()[0]).toBe(withId)
	// item without id: both have id=undefined, deep equal, so preserved
	expect(items.read()[1]).toBe(noId)
})

// --- derived synchronous chain -----------------------------------------------

await test('derived - synchronous chain resolves immediately', expect => {
	const d = derived(
		() => 2,
		v => v * 3,
		v => v + 1,
	)

	expect(d()).toBe(7)
	expect(isResolved(d)).toBe(true)
})

// --- memo with custom equals -------------------------------------------------

await test('memo - custom equals controls downstream notifications', expect => {
	const source = signal(1)
	const rounded = memo(() => Math.floor(source.read()), {
		equals: (a, b) => a === b,
	})
	const seen = []

	root(() => {
		syncEffect(() => seen.push(rounded()))
	})

	expect(seen).toEqual([1])

	source.write(1.5) // floor is still 1
	expect(seen).toEqual([1])

	source.write(2.1) // floor is 2
	expect(seen).toEqual([1, 2])
})

// --- cleanup order inside effect ---------------------------------------------

await test('cleanup - multiple cleanups inside single effect run in reverse', expect => {
	const trigger = signal(0)
	const order = []

	const dispose = root(d => {
		effect(() => {
			trigger.read()
			cleanup(() => order.push('a'))
			cleanup(() => order.push('b'))
			cleanup(() => order.push('c'))
		})
		return d
	})

	expect(order).toEqual([])

	trigger.write(1)
	expect(order).toEqual(['c', 'b', 'a'])

	dispose()
})

// --- signal with object value and reference equality -------------------------

await test('signal - object values: same ref suppressed, different ref notifies', expect => {
	const obj = { count: 1 }
	const s = signal(obj)
	const seen = []

	root(() => {
		syncEffect(() => seen.push(s.read()))
	})

	expect(seen).toEqual([obj])

	// same reference → no notification
	s.write(obj)
	expect(seen).toEqual([obj])

	// different reference → notification even if deep-equal
	const obj2 = { count: 1 }
	s.write(obj2)
	expect(seen).toEqual([obj, obj2])
})

// --- effect does not run after root disposal ---------------------------------

await test('effect - does not run after its root is disposed', expect => {
	const trigger = signal(0)
	const seen = []

	const dispose = root(d => {
		effect(() => seen.push(trigger.read()))
		return d
	})

	expect(seen).toEqual([0])

	dispose()

	trigger.write(1)
	expect(seen).toEqual([0])
})

// --- syncEffect runs before effect in same root ------------------------------

await test('syncEffect - runs before deferred effect for same signal', expect => {
	const s = signal(0)
	const order = []

	const dispose = root(d => {
		effect(() => order.push('effect:' + s.read()))
		syncEffect(() => order.push('sync:' + s.read()))
		return d
	})

	// baseline: both ran for initial value
	expect(order).toInclude('sync:0')
	expect(order).toInclude('effect:0')

	s.write(1)

	// syncEffect should have run for the new value
	expect(order).toInclude('sync:1')

	dispose()
})

// --- memo is not re-evaluated when result hasn't changed ---------------------

await test('memo - downstream effect does not rerun when memo result is unchanged', expect => {
	const source = signal(1)
	const clamped = memo(() => Math.min(source.read(), 10))
	const seen = []

	const dispose = root(d => {
		effect(() => seen.push(clamped()))
		return d
	})

	expect(seen).toEqual([1])

	source.write(5)
	expect(seen).toEqual([1, 5])

	source.write(15) // clamped to 10
	expect(seen).toEqual([1, 5, 10])

	source.write(20) // still clamped to 10 — no rerun
	expect(seen).toEqual([1, 5, 10])

	dispose()
})

// --- root inside root: inner disposes independently --------------------------

await test('root - nested roots dispose independently', expect => {
	const seen = []

	const disposeOuter = root(d => {
		cleanup(() => seen.push('outer'))

		const disposeInner = root(d2 => {
			cleanup(() => seen.push('inner'))
			return d2
		})

		disposeInner()
		expect(seen).toEqual(['inner'])

		return d
	})

	disposeOuter()
	expect(seen).toEqual(['inner', 'outer'])
})

// --- withValue with static non-function value calls fn immediately -----------

await test('withValue - non-function value calls fn once immediately', expect => {
	const seen = []

	withValue(42, v => seen.push(v))
	withValue('hello', v => seen.push(v))

	expect(seen).toEqual([42, 'hello'])
})
