/** @jsxImportSource pota */

// Tests for `setClass()`, `setClassList()`, and the JSX `class` /
// `class:name` props — string, array, object, and reactive forms;
// type-switching limitations across renders.

import { $, test } from '#test'
import { render, root, setClass, setClassList, signal } from 'pota'

await test('JSX class prop - object form adds and removes classes based on boolean values', expect => {
	const active = signal(true)
	const dispose = render(
		<p class={{ active: active.read, hidden: false, base: true }} />,
	)
	const el = $('p')
	expect(el.classList.contains('base')).toBe(true)
	expect(el.classList.contains('active')).toBe(true)
	expect(el.classList.contains('hidden')).toBe(false)
	active.write(false)
	expect(el.classList.contains('active')).toBe(false)
	dispose()
})

await test('JSX class:name prop - namespaced class toggles single class reactively', expect => {
	const on = signal(true)
	const dispose = render(<p class:highlight={on.read} />)
	const el = $('p')
	expect(el.classList.contains('highlight')).toBe(true)
	on.write(false)
	expect(el.classList.contains('highlight')).toBe(false)
	dispose()
})

// --- setClass (direct API: setElementClass as setClass) --------------------------

await test('setClass - toggles a single class on and off', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setClass(node, 'alpha', true)
	setClass(node, 'beta', true)

	expect(node.classList.contains('alpha')).toBe(true)
	expect(node.classList.contains('beta')).toBe(true)

	setClass(node, 'alpha', false)
	expect(node.classList.contains('alpha')).toBe(false)
	expect(node.classList.contains('beta')).toBe(true)

	node.remove()
})

await test('setClass - reactive signal toggles a class', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const active = signal(true)

	setClass(node, 'active', active.read)

	expect(node.classList.contains('active')).toBe(true)

	active.write(false)
	expect(node.classList.contains('active')).toBe(false)

	active.write(true)
	expect(node.classList.contains('active')).toBe(true)

	node.remove()
})

// --- setClassList (direct API) ---------------------------------------------------

await test('setClassList - object form adds and removes classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const active = signal(true)

	setClassList(node, () => ({
		active: active.read(),
		hidden: !active.read(),
	}))

	expect(node.classList.contains('active')).toBe(true)
	expect(node.classList.contains('hidden')).toBe(false)

	active.write(false)

	expect(node.classList.contains('active')).toBe(false)
	expect(node.classList.contains('hidden')).toBe(true)

	node.remove()
})

await test('setClassList - string form adds space-separated classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, 'foo bar')

		expect(node.classList.contains('foo')).toBe(true)
		expect(node.classList.contains('bar')).toBe(true)

		dispose()
	})

	node.remove()
})

await test('setClassList - clearing with empty object removes classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, { a: true, b: true })
		expect(node.classList.contains('a')).toBe(true)
		expect(node.classList.contains('b')).toBe(true)

		setClassList(node, { a: false, b: false })
		expect(node.className).toBe('')

		dispose()
	})

	node.remove()
})

await test('setClassList - empty object is a no-op, while explicit false values remove classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	root(dispose => {
		setClassList(node, 'alpha beta')
		expect(node.className).toBe('alpha beta')

		setClassList(node, {})
		expect(node.className).toBe('alpha beta')

		setClassList(node, { alpha: false, beta: false })
		expect(node.className).toBe('')

		dispose()
	})

	node.remove()
})

// --- setClass with string ----------------------------------------------------

await test('setClass - string value sets className directly', expect => {
	const node = document.createElement('div')
	node.className = 'old'

	setClass(node, 'alpha', true)
	expect(node.classList.contains('alpha')).toBe(true)
	expect(node.classList.contains('old')).toBe(true)
})

// --- setClassList reactive function returning object -------------------------

await test('setClassList - reactive function tracks previous classes', expect => {
	const node = document.createElement('div')
	document.body.append(node)
	const cls = signal('alpha')

	const dispose = root(d => {
		setClassList(node, cls.read)
		return d
	})

	// effect runs the first class assignment
	expect(node.classList.contains('alpha')).toBe(true)

	cls.write('beta')
	expect(node.classList.contains('beta')).toBe(true)
	expect(node.classList.contains('alpha')).toBe(false)

	dispose()
	node.remove()
})

// --- class as array ----------------------------------------------------------

await test('JSX class prop - array form joins classes', expect => {
	const dispose = render(<p class={['alpha', 'beta']}>text</p>)
	const el = $('p')
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)
	dispose()
})

await test('JSX class prop - array with null/falsy items skips them', expect => {
	const dispose = render(
		<p class={['alpha', null, '', 'beta', false, 'gamma']}>text</p>,
	)
	const el = $('p')
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)
	expect(el.classList.contains('gamma')).toBe(true)
	expect(el.classList.length).toBe(3)
	dispose()
})

await test('JSX class prop - reactive switching from string to array', expect => {
	const cls = signal(/** @type {string | string[]} */ ('initial'))
	const dispose = render(<p class={cls.read}>text</p>)
	const el = $('p')
	expect(el.className).toBe('initial')

	cls.write(['alpha', 'beta'])
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)
	expect(el.classList.contains('initial')).toBe(false)

	dispose()
})

await test('JSX class prop - reactive switching from array to string', expect => {
	const cls = signal(
		/** @type {string | string[]} */ (['alpha', 'beta']),
	)
	const dispose = render(<p class={cls.read}>text</p>)
	const el = $('p')
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)

	cls.write('gamma')
	expect(el.className).toBe('gamma')
	expect(el.classList.contains('alpha')).toBe(false)
	expect(el.classList.contains('beta')).toBe(false)

	dispose()
})

await test('JSX class prop - reactive switching from object to array', expect => {
	const cls = signal(
		/** @type {Record<string, boolean> | string[]} */ ({
			active: true,
			hidden: true,
		}),
	)
	const dispose = render(<p class={cls.read}>text</p>)
	const el = $('p')
	expect(el.classList.contains('active')).toBe(true)
	expect(el.classList.contains('hidden')).toBe(true)

	cls.write(['fresh', 'new'])
	expect(el.classList.contains('fresh')).toBe(true)
	expect(el.classList.contains('new')).toBe(true)
	// object→array: prev object classes are not removed (cross-type limitation)
	expect(el.classList.contains('active')).toBe(true)
	expect(el.classList.contains('hidden')).toBe(true)

	dispose()
})

await test('JSX class prop - reactive switching from array to object', expect => {
	const cls = signal(
		/** @type {string[] | Record<string, boolean>} */ ([
			'alpha',
			'beta',
		]),
	)
	const dispose = render(<p class={cls.read}>text</p>)
	const el = $('p')
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)

	cls.write({ gamma: true, delta: false })
	expect(el.classList.contains('gamma')).toBe(true)
	expect(el.classList.contains('delta')).toBe(false)
	// array→object: prev array classes are not removed (cross-type limitation)
	expect(el.classList.contains('alpha')).toBe(true)
	expect(el.classList.contains('beta')).toBe(true)

	dispose()
})

// --- setClassList with mixed true/false values -----------------------

await test('setClassList - object form with mixed values adds true classes and removes false', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	setClassList(node, { a: true, b: false, c: true, d: false })

	expect(node.classList.contains('a')).toBe(true)
	expect(node.classList.contains('b')).toBe(false)
	expect(node.classList.contains('c')).toBe(true)
	expect(node.classList.contains('d')).toBe(false)

	node.remove()
})

// --- setClassList with empty string is a no-op ---------------------

await test('setClassList - empty string does not throw and adds nothing', expect => {
	const node = document.createElement('div')
	document.body.append(node)

	expect(() => setClassList(node, '')).not.toThrow()
	expect(node.classList.length).toBe(0)

	node.remove()
})

// --- class as an object ---------------------------------------------

await test('JSX class prop - object with boolean values (static)', expect => {
	const dispose = render(
		<div class={{ one: true, two: false, three: true }} />,
	)

	const el = $('div')
	expect(el.classList.contains('one')).toBe(true)
	expect(el.classList.contains('two')).toBe(false)
	expect(el.classList.contains('three')).toBe(true)

	dispose()
})

// --- reactive class object updates classes --------------------------

await test('JSX class prop - object with function values updates reactively', expect => {
	const active = signal(false)

	const dispose = render(
		<div class={{ static: true, active: () => active.read() }} />,
	)

	const el = $('div')
	expect(el.classList.contains('static')).toBe(true)
	expect(el.classList.contains('active')).toBe(false)

	active.write(true)
	expect(el.classList.contains('active')).toBe(true)

	active.write(false)
	expect(el.classList.contains('active')).toBe(false)

	dispose()
})
