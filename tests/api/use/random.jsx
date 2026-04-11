/** @jsxImportSource pota */
// Tests for pota/use/random: chance, random, randomBetween,
// randomColor, randomId, and randomSeeded (deterministic).

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

await test('random - randomSeeded with different seeds produces different results', expect => {
	const a = randomSeeded(1)
	const b = randomSeeded(2)

	expect(a()).not.toBe(b())
})

await test('random - randomBetween defaults to 0-100', expect => {
	const val = randomBetween()
	expect(val >= 0).toBe(true)
	expect(val <= 100).toBe(true)
})

await test('random - chance with 0 always returns false', expect => {
	const gen = randomSeeded(42)
	for (let i = 0; i < 10; i++) {
		expect(chance(0, gen)).toBe(false)
	}
})

await test('random - chance with 100 always returns true', expect => {
	const gen = randomSeeded(42)
	for (let i = 0; i < 10; i++) {
		expect(chance(100, gen)).toBe(true)
	}
})

// --- randomBetween with fractional generator values ------------------

await test('random - randomBetween rounds down via Math.floor', expect => {
	// 0.5 * (10 - 0 + 1) = 5.5 → floor → 5
	expect(randomBetween(0, 10, () => 0.5)).toBe(5)
})

// --- randomBetween with equal min/max returns that value ------------

await test('random - randomBetween with equal bounds always returns that value', expect => {
	expect(randomBetween(7, 7, () => 0)).toBe(7)
	expect(randomBetween(7, 7, () => 0.999)).toBe(7)
})

// --- randomBetween with negative range ------------------------------

await test('random - randomBetween handles negative ranges', expect => {
	expect(randomBetween(-10, -5, () => 0)).toBe(-10)
	expect(randomBetween(-10, -5, () => 0.999)).toBe(-5)
})

// --- randomColor with specific min/max ----------------------------

await test('random - randomColor with min=max=0 produces black', expect => {
	expect(randomColor(0, 0)).toBe('rgb(0,0,0)')
})

await test('random - randomColor with min=max=255 produces white', expect => {
	expect(randomColor(255, 255)).toBe('rgb(255,255,255)')
})

// --- randomId uniqueness across calls ----------------------------

await test('random - randomId returns different ids on successive calls', expect => {
	const a = randomId()
	const b = randomId()
	const c = randomId()

	// collision is astronomically unlikely with 64 random bits
	expect(a).not.toBe(b)
	expect(b).not.toBe(c)
})

// --- randomSeeded produces values between 0 and 1 ----------------

await test('random - randomSeeded values are in the [0, 1) range', expect => {
	const gen = randomSeeded(999)

	for (let i = 0; i < 50; i++) {
		const v = gen()
		expect(v >= 0 && v < 1).toBe(true)
	}
})

// --- chance with 50 uses the generator ---------------------------

await test('random - chance with 50 threshold uses the generator value', expect => {
	expect(chance(50, () => 0.49)).toBe(true)
	expect(chance(50, () => 0.51)).toBe(false)
})
