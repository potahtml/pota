/** @jsxImportSource pota */
// Tests for pota/use/animate: animateClassTo and animatePartTo,
// class/part swapping with and without active animations.

import { test } from '#test'

import { animateClassTo, animatePartTo } from 'pota/use/animate'

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
	node.getAnimations = () => [{}]

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
	node.getAnimations = () => [{}] // has active animation

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
