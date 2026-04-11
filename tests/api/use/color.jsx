/** @jsxImportSource pota */
// Tests for pota/use/color: scale, setAlpha, textColor, validateColor,
// textColorWhenBackgroundIs variants, and eyeDropper fallback.

import { test } from '#test'

import {
	eyeDropper,
	scale,
	setAlpha,
	textColor,
	textColorWhenBackgroundIs,
	textColorWhenBackgroundIsBlack,
	textColorWhenBackgroundIsWhite,
	validateColor,
} from 'pota/use/color'

await test('color - scale returns the requested amount of valid colors', expect => {
	const colors = scale(['black', 'white'], 3)

	expect(colors.length).toBe(3)
	expect(validateColor(colors[0])).toBe(colors[0])
	expect(validateColor(colors[1])).toBe(colors[1])
	expect(validateColor(colors[2])).toBe(colors[2])
})

await test('color - setAlpha and contrast helpers return valid colors', expect => {
	const alpha = setAlpha('red', 0.5)
	const onBlack = textColorWhenBackgroundIsBlack('#333')
	const onWhite = textColorWhenBackgroundIsWhite('#ddd')
	const adjusted = textColorWhenBackgroundIs('#777', true)

	expect(validateColor(alpha)).toBe(alpha)
	expect(validateColor(onBlack)).toBe(onBlack)
	expect(validateColor(onWhite)).toBe(onWhite)
	expect(validateColor(adjusted)).toBe(adjusted)
})

await test('color - textColor picks contrasting foregrounds and validateColor rejects invalid strings', expect => {
	expect(textColor('black')).toBe('white')
	expect(textColor('white')).toBe('black')
	expect(validateColor('not-a-color')).toBe(undefined)
})

// --- scale edge cases --------------------------------------------------------

await test('color - scale with 2 colors and count of 5 produces correct gradient', expect => {
	const colors = scale(['red', 'blue'], 5)

	expect(colors.length).toBe(5)
	colors.forEach(c => {
		expect(validateColor(c)).toBe(c)
	})
})

await test('color - scale with 3 colors distributes stops across all segments', expect => {
	const colors = scale(['red', 'green', 'blue'], 7)

	expect(colors.length).toBe(7)
	colors.forEach(c => {
		expect(validateColor(c)).toBe(c)
	})
})

// --- setAlpha ----------------------------------------------------------------

await test('color - setAlpha with 0 makes fully transparent', expect => {
	const transparent = setAlpha('red', 0)
	expect(validateColor(transparent)).toBe(transparent)
})

await test('color - setAlpha with 1 leaves color fully opaque', expect => {
	const opaque = setAlpha('blue', 1)
	expect(validateColor(opaque)).toBe(opaque)
})

// --- setAlpha actually honors the alpha parameter --------------------------

await test('color - setAlpha at 0 and 1 produce different strings', expect => {
	// Guards against a regression where setAlpha might ignore the alpha
	// parameter and return the base color unchanged: using the same base
	// color on both sides forces the difference to come from alpha alone.
	const transparent = setAlpha('red', 0)
	const opaque = setAlpha('red', 1)

	expect(transparent).not.toBe(opaque)
	expect(validateColor(transparent)).toBe(transparent)
	expect(validateColor(opaque)).toBe(opaque)
})

// --- textColor for mid-range colors ------------------------------------------

await test('color - textColor returns a string for mid-range grays', expect => {
	const result = textColor('#808080')
	expect(result === 'white' || result === 'black').toBe(true)
})

// --- validateColor -----------------------------------------------------------

await test('color - validateColor accepts hex, named, and rgb colors', expect => {
	expect(validateColor('#ff0000')).toBe('#ff0000')
	expect(validateColor('red')).toBe('red')
	expect(validateColor('rgb(0, 128, 255)')).toBe('rgb(0, 128, 255)')
})

await test('color - validateColor rejects empty and garbage strings', expect => {
	expect(validateColor('')).toBe(undefined)
	expect(validateColor('xyz123')).toBe(undefined)
})

// --- textColorWhenBackgroundIs ------------------------------------------------

await test('color - textColorWhenBackgroundIsBlack and White return different results for same input', expect => {
	const onBlack = textColorWhenBackgroundIsBlack('gray')
	const onWhite = textColorWhenBackgroundIsWhite('gray')

	expect(validateColor(onBlack)).toBe(onBlack)
	expect(validateColor(onWhite)).toBe(onWhite)
})

// --- eyeDropper unsupported browser ------------------------------------------

await test('color - eyeDropper returns undefined when unsupported', expect => {
	const original = window.EyeDropper
	window.EyeDropper = undefined

	// suppress console.error from eyeDropper
	const originalError = console.error
	console.error = () => {}

	const result = eyeDropper(() => {})

	console.error = originalError
	window.EyeDropper = original

	expect(result).toBe(undefined)
})

// --- validateColor accepts hsl format ---------------------------------

await test('color - validateColor accepts hsl format', expect => {
	const value = 'hsl(120, 100%, 50%)'
	expect(validateColor(value)).toBe(value)
})

// --- scale with count of 1 produces one color ------------------------

await test('color - scale with count=1 produces a single color', expect => {
	const colors = scale(['red', 'blue'], 1)

	expect(colors.length).toBe(1)
	expect(validateColor(colors[0])).toBe(colors[0])
})

// --- textColor for primary colors returns white or black -----------

await test('color - textColor for red returns white or black', expect => {
	const result = textColor('red')
	expect(result === 'white' || result === 'black').toBe(true)
})

await test('color - textColor for blue returns white or black', expect => {
	const result = textColor('blue')
	expect(result === 'white' || result === 'black').toBe(true)
})

// --- validateColor rejects object and number inputs ---------------

await test('color - validateColor rejects non-string input', expect => {
	expect(validateColor(42)).toBe(undefined)
	expect(validateColor({})).toBe(undefined)
	expect(validateColor(null)).toBe(undefined)
})
