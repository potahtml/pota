/** @jsxImportSource pota */
// Tests for pota/use/animate: animateClassTo and animatePartTo,
// class/part swapping with and without active animations; plus
// stopAnimations, documentKeyframes, and useAnimationFrame.

import { test } from '#test'

import { root } from 'pota'
import {
	animateClassTo,
	animatePartTo,
	documentKeyframes,
	stopAnimations,
	useAnimationFrame,
} from 'pota/use/animate'

const twoFrames = () =>
	new Promise(r =>
		requestAnimationFrame(() => requestAnimationFrame(r)),
	)

await test('animate - animateClassTo swaps classes without waiting when there are no animations', async expect => {
	const node = document.createElement('div')
	node.className = 'old'
	node.getAnimations = () => []

	await animateClassTo(node, 'old', 'next')

	expect(node.className).toBe('next')
})

await test('animate - animatePartTo swaps parts and waits for animationend when needed', async expect => {
	const node = document.createElement('div')
	node.part.add('from')
	node.getAnimations = /** @type {any} */ (() => [{}])

	const waiting = animatePartTo(node, 'from', 'to')

	requestAnimationFrame(() => {
		node.dispatchEvent(new Event('animationend'))
	})

	await waiting

	expect(node.part.contains('from')).toBe(false)
	expect(node.part.contains('to')).toBe(true)
})

await test('animate - animateClassTo waits for animationend when animations exist', async expect => {
	const node = document.createElement('div')
	node.className = 'current'
	node.getAnimations = /** @type {any} */ (() => [{}]) // has active animation

	// baseline: class is current before animation
	expect(node.className).toBe('current')

	const waiting = animateClassTo(node, 'current', 'next')

	// dispatch animationend in a nested rAF so it fires after the swap
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			node.dispatchEvent(new Event('animationend'))
		})
	})

	await waiting

	// after animationend, class has been swapped
	expect(node.className).toBe('next')
})

await test('animate - animatePartTo resolves immediately when no animations', async expect => {
	const node = document.createElement('div')
	node.part.add('old')
	node.getAnimations = () => [] // no animations

	await animatePartTo(node, 'old', 'new')

	expect(node.part.contains('old')).toBe(false)
	expect(node.part.contains('new')).toBe(true)
})

// --- animateClassTo preserves other classes ---------------------------

await test('animate - animateClassTo does not affect unrelated classes', async expect => {
	const node = document.createElement('div')
	node.className = 'old keep other'
	node.getAnimations = () => []

	await animateClassTo(node, 'old', 'new')

	expect(node.classList.contains('old')).toBe(false)
	expect(node.classList.contains('new')).toBe(true)
	expect(node.classList.contains('keep')).toBe(true)
	expect(node.classList.contains('other')).toBe(true)
})

// --- animatePartTo preserves other parts ------------------------------

await test('animate - animatePartTo does not affect unrelated parts', async expect => {
	const node = document.createElement('div')
	node.part.add('old')
	node.part.add('keep')
	node.getAnimations = () => []

	await animatePartTo(node, 'old', 'new')

	expect(node.part.contains('old')).toBe(false)
	expect(node.part.contains('new')).toBe(true)
	expect(node.part.contains('keep')).toBe(true)
})

// --- animateClassTo with missing old class still adds new ------------

await test('animate - animateClassTo adds the new class even if old was absent', async expect => {
	const node = document.createElement('div')
	node.className = 'other'
	node.getAnimations = () => []

	await animateClassTo(node, 'missing', 'added')

	expect(node.classList.contains('added')).toBe(true)
	expect(node.classList.contains('other')).toBe(true)
})

// --- stopAnimations -------------------------------------------------

await test('animate - stopAnimations cancels every animation on the element', expect => {
	const canceled = []
	const node = document.createElement('div')
	const fakes = [
		{ cancel: () => canceled.push('a') },
		{ cancel: () => canceled.push('b') },
	]
	node.getAnimations = /** @type {any} */ (() => fakes)

	const returned = stopAnimations(node)

	expect(canceled).toEqual(['a', 'b'])
	expect(returned).toBe(fakes)
})

await test('animate - stopAnimations returns empty list when nothing is running', expect => {
	const node = document.createElement('div')
	node.getAnimations = () => []

	expect(stopAnimations(node)).toEqual([])
})

// --- documentKeyframes ---------------------------------------------

await test('animate - documentKeyframes surfaces @keyframes from adoptedStyleSheets', expect => {
	const sheet = new CSSStyleSheet()
	sheet.replaceSync(
		'@keyframes pota_spin { from { opacity: 0 } to { opacity: 1 } }',
	)
	document.adoptedStyleSheets = [sheet]

	try {
		const kf = documentKeyframes()
		expect('pota_spin' in kf).toBe(true)
		expect(kf.pota_spin.length > 0).toBe(true)
	} finally {
		// harness asserts adoptedStyleSheets is empty after each test
		document.adoptedStyleSheets = []
	}
})

// --- useAnimationFrame ---------------------------------------------

await test('animate - useAnimationFrame does not start automatically', async expect => {
	const ticks = []

	await root(async dispose => {
		useAnimationFrame(t => ticks.push(t))
		await twoFrames()
		expect(ticks).toEqual([])
		dispose()
	})
})

await test('animate - useAnimationFrame loops while running and auto-stops on dispose', async expect => {
	const ticks = []
	/** @type {() => void} */
	let dispose = () => {}

	await root(d => {
		dispose = d
		useAnimationFrame(t => ticks.push(t)).start()
	})

	await twoFrames()
	const after = ticks.length
	expect(after >= 2).toBe(true)

	dispose()
	await twoFrames()
	expect(ticks.length).toBe(after)
})

await test('animate - useAnimationFrame stop halts and start can resume', async expect => {
	const ticks = []

	await root(async dispose => {
		const ctrl = useAnimationFrame(() => ticks.push(1))
		ctrl.start()
		await twoFrames()

		ctrl.stop()
		const paused = ticks.length
		await twoFrames()
		expect(ticks.length).toBe(paused)

		ctrl.start()
		await twoFrames()
		expect(ticks.length > paused).toBe(true)

		dispose()
	})
})

await test('animate - useAnimationFrame stop() inside the callback breaks the loop', async expect => {
	let count = 0

	await root(async dispose => {
		const ctrl = useAnimationFrame(() => {
			count++
			if (count === 1) ctrl.stop()
		})
		ctrl.start()
		await twoFrames()
		expect(count).toBe(1)
		dispose()
	})
})
