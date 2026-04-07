/** @jsxImportSource pota */

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
