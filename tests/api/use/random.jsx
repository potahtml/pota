/** @jsxImportSource pota */

import { test } from '#test'

import {
	chance,
	random,
	randomBetween,
	randomColor,
	randomId,
	randomSeeded,
} from 'pota/use/random'

await test('random - chance respects the provided generator', expect => {
	expect(chance(50, () => 0.1)).toBe(true)
	expect(chance(50, () => 0.9)).toBe(false)
	expect(chance(0, () => 0)).toBe(false)
	expect(chance(100, () => 0.999)).toBe(true)
})

await test('random - random returns a float in [0, 1)', expect => {
	const value = random()
	expect(value >= 0).toBe(true)
	expect(value < 1).toBe(true)
})

await test('random - randomBetween produces inclusive bounds', expect => {
	expect(randomBetween(10, 20, () => 0)).toBe(10)
	expect(randomBetween(10, 20, () => 0.999999)).toBe(20)
	expect(randomBetween(undefined, undefined, () => 0)).toBe(0)
	expect(randomBetween(undefined, undefined, () => 0.999999)).toBe(
		100,
	)
})

await test('random - randomColor honors the provided channel range', expect => {
	expect(randomColor(1, 1)).toBe('rgb(1,1,1)')
	expect(randomColor()).toMatch(/^rgb\(\d+,\d+,\d+\)$/)
})

await test('random - randomId returns a non-empty base36-like string', expect => {
	const id = randomId()

	expect(typeof id).toBe('string')
	expect(id.length > 0).toBe(true)
	expect(id).toMatch(/^[0-9a-z]+$/)
})

await test('random - randomSeeded is deterministic', expect => {
	const a = randomSeeded(123)
	const b = randomSeeded(123)

	expect([a(), a(), a()]).toEqual([b(), b(), b()])
	expect(a()).toBe(b())
})
