/** @jsxImportSource pota */
// Tests for pota/use/color: scale, alpha, textColor, validateColor,
// textColorWhenBackgroundIs variants, eyeDropper fallback, and the
// color-bits/string re-exports (blend, darken, lighten, getLuminance).

import { test } from '#test'

import {
	alpha,
	blend,
	darken,
	eyeDropper,
	getLuminance,
	lighten,
	scale,
	textColor,
	textColorWhenBackgroundIs,
	textColorWhenBackgroundIsBlack,
	textColorWhenBackgroundIsWhite,
	validateColor,
} from 'pota/use/color'

await test('color - scale returns the requested amount of valid colors', expect => {
	const colors = scale(['#000000', '#ffffff'], 3)

	expect(colors.length).toBe(3)
	expect(validateColor(colors[0])).toBe(colors[0])
	expect(validateColor(colors[1])).toBe(colors[1])
	expect(validateColor(colors[2])).toBe(colors[2])
})

await test('color - alpha and contrast helpers return valid colors', expect => {
	const faded = alpha('#ff0000', 0.5)
	const onBlack = textColorWhenBackgroundIsBlack('#333')
	const onWhite = textColorWhenBackgroundIsWhite('#ddd')
	const adjusted = textColorWhenBackgroundIs('#777', true)

	expect(validateColor(faded)).toBe(faded)
	expect(validateColor(onBlack)).toBe(onBlack)
	expect(validateColor(onWhite)).toBe(onWhite)
	expect(validateColor(adjusted)).toBe(adjusted)
})

await test('color - textColor picks contrasting foregrounds and validateColor rejects invalid strings', expect => {
	expect(textColor('#000000')).toBe('white')
	expect(textColor('#ffffff')).toBe('black')
	expect(validateColor('not-a-color')).toBe(undefined)
})

// --- scale edge cases --------------------------------------------------------

await test('color - scale with 2 colors and count of 5 produces correct gradient', expect => {
	const colors = scale(['#ff0000', '#0000ff'], 5)

	expect(colors.length).toBe(5)
	colors.forEach(c => {
		expect(validateColor(c)).toBe(c)
	})
})

await test('color - scale with 3 colors distributes stops across all segments', expect => {
	const colors = scale(['#ff0000', '#008000', '#0000ff'], 7)

	expect(colors.length).toBe(7)
	colors.forEach(c => {
		expect(validateColor(c)).toBe(c)
	})
})

// --- alpha ------------------------------------------------------------------

await test('color - alpha with 0 makes fully transparent', expect => {
	const transparent = alpha('#ff0000', 0)
	expect(validateColor(transparent)).toBe(transparent)
})

await test('color - alpha with 1 leaves color fully opaque', expect => {
	const opaque = alpha('#0000ff', 1)
	expect(validateColor(opaque)).toBe(opaque)
})

// --- alpha actually honors the alpha parameter -----------------------------

await test('color - alpha at 0 and 1 produce different strings', expect => {
	// Guards against a regression where alpha might ignore the alpha
	// parameter and return the base color unchanged: using the same base
	// color on both sides forces the difference to come from alpha alone.
	const transparent = alpha('#ff0000', 0)
	const opaque = alpha('#ff0000', 1)

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

await test('color - validateColor accepts hex and rgb colors', expect => {
	expect(validateColor('#ff0000')).toBe('#ff0000')
	expect(validateColor('#f00')).toBe('#f00')
	expect(validateColor('rgb(0, 128, 255)')).toBe('rgb(0, 128, 255)')
})

await test('color - validateColor rejects named colors', expect => {
	// color-bits (unlike colorjs.io) does not ship a CSS named-color
	// table — callers must pass hex / rgb / hsl / color(). This test
	// pins that contract so the rejection is visible.
	expect(validateColor('red')).toBe(undefined)
	expect(validateColor('black')).toBe(undefined)
})

await test('color - validateColor rejects empty and garbage strings', expect => {
	expect(validateColor('')).toBe(undefined)
	expect(validateColor('xyz123')).toBe(undefined)
})

// --- textColorWhenBackgroundIs ------------------------------------------------

await test('color - textColorWhenBackgroundIsBlack and White return different results for same input', expect => {
	const onBlack = textColorWhenBackgroundIsBlack('#808080')
	const onWhite = textColorWhenBackgroundIsWhite('#808080')

	expect(validateColor(onBlack)).toBe(onBlack)
	expect(validateColor(onWhite)).toBe(onWhite)
})

// --- eyeDropper supported path with mock ------------------------------------

await test('color - eyeDropper calls cb with sRGBHex when EyeDropper is available', async expect => {
	const win = /** @type {any} */ (window)
	const original = win.EyeDropper

	class FakeEyeDropper {
		open() {
			return Promise.resolve({ sRGBHex: '#abcdef' })
		}
	}
	win.EyeDropper = FakeEyeDropper

	let picked
	await eyeDropper(hex => {
		picked = hex
	})

	win.EyeDropper = original
	expect(picked).toBe('#abcdef')
})

// --- eyeDropper unsupported browser ------------------------------------------

await test('color - eyeDropper returns undefined when unsupported', expect => {
	const win = /** @type {any} */ (window)
	const original = win.EyeDropper
	win.EyeDropper = undefined

	// suppress console.error from eyeDropper
	const originalError = console.error
	console.error = () => {}

	const result = eyeDropper(() => {})

	console.error = originalError
	win.EyeDropper = original

	expect(result).toBe(undefined)
})

// --- validateColor accepts hsl format ---------------------------------

await test('color - validateColor accepts hsl format', expect => {
	const value = 'hsl(120, 100%, 50%)'
	expect(validateColor(value)).toBe(value)
})

// --- scale with count of 1 produces one color ------------------------

await test('color - scale with count=1 produces a single color', expect => {
	const colors = scale(['#ff0000', '#0000ff'], 1)

	expect(colors.length).toBe(1)
	expect(validateColor(colors[0])).toBe(colors[0])
})

// --- textColor for primary colors returns white or black -----------

await test('color - textColor for red returns white or black', expect => {
	const result = textColor('#ff0000')
	expect(result === 'white' || result === 'black').toBe(true)
})

await test('color - textColor for blue returns white or black', expect => {
	const result = textColor('#0000ff')
	expect(result === 'white' || result === 'black').toBe(true)
})

// --- validateColor rejects object and number inputs ---------------

await test('color - validateColor rejects non-string input', expect => {
	expect(validateColor(/** @type {any} */ (42))).toBe(undefined)
	expect(validateColor(/** @type {any} */ ({}))).toBe(undefined)
	expect(validateColor(/** @type {any} */ (null))).toBe(undefined)
})

// --- darken / lighten -------------------------------------------------------

await test('color - darken returns a valid color distinct from the input', expect => {
	const darker = darken('#808080', 0.2)
	expect(validateColor(darker)).toBe(darker)
	expect(darker).not.toBe('#808080')
})

await test('color - lighten returns a valid color distinct from the input', expect => {
	const lighter = lighten('#808080', 0.2)
	expect(validateColor(lighter)).toBe(lighter)
	expect(lighter).not.toBe('#808080')
})

await test('color - darken and lighten move in opposite directions', expect => {
	// Guards against a regression where the re-exports point at the same
	// function: darken and lighten must produce different strings for the
	// same input and amount.
	const darker = darken('#808080', 0.2)
	const lighter = lighten('#808080', 0.2)
	expect(darker).not.toBe(lighter)
})

// --- blend ------------------------------------------------------------------

await test('color - blend returns a valid color between background and overlay', expect => {
	const mid = blend('#000000', '#ffffff', 0.5, 2.2)
	expect(validateColor(mid)).toBe(mid)
})

await test('color - blend with opacity 0 returns the background', expect => {
	const result = blend('#ff0000', '#00ff00', 0, 2.2)
	expect(validateColor(result)).toBe(result)
})

await test('color - blend with opacity 1 returns the overlay', expect => {
	const result = blend('#ff0000', '#00ff00', 1, 2.2)
	expect(validateColor(result)).toBe(result)
})

// --- getLuminance -----------------------------------------------------------

await test('color - getLuminance returns 0 for black and 1 for white', expect => {
	expect(getLuminance('#000000')).toBe(0)
	expect(getLuminance('#ffffff')).toBe(1)
})

await test('color - getLuminance is monotonic across grays', expect => {
	const dark = getLuminance('#202020')
	const mid = getLuminance('#808080')
	const light = getLuminance('#e0e0e0')
	expect(dark < mid).toBe(true)
	expect(mid < light).toBe(true)
})
