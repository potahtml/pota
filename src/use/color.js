import {
	parse,
	formatHEXA,
	getRed,
	getGreen,
	getBlue,
	getAlpha,
	darken,
	lighten,
} from 'color-bits'

export {
	alpha,
	blend,
	darken,
	lighten,
	getLuminance,
} from 'color-bits/string'

import { noop } from '../lib/std.js'

/** @typedef {import("color-bits").Color} Color */

const WHITE = /*#__PURE__*/ parse('#ffffff')
const BLACK = /*#__PURE__*/ parse('#000000')
const APCA_Y_WHITE = /*#__PURE__*/ apcaLuminance(WHITE)
const APCA_Y_BLACK = /*#__PURE__*/ apcaLuminance(BLACK)

/**
 * @typedef {new () => { open: () => Promise<{ sRGBHex: string }> }} EyeDropperCtor
 */

/**
 * Opens the browser EyeDropper API (when supported) and invokes the
 * callback with the picked color.
 *
 * @param {(hex: string) => void} cb
 * @returns {Promise<void> | void}
 */
export const eyeDropper = cb => {
	const Ctor = /** @type {{ EyeDropper?: EyeDropperCtor }} */ (window)
		.EyeDropper
	return !Ctor
		? console.error('Your Browser Doesnt Support Picking Colors!')
		: new Ctor()
				.open()
				.then(result => {
					cb(result.sRGBHex)
				})
				.catch(noop)
}

/**
 * Returns a gradient array of length `count` that passes through all of
 * the given stop colors, interpolated in OkLab space for perceptually
 * uniform transitions. Output is `oklab(L a b / alpha)` CSS strings —
 * the browser handles gamut mapping natively.
 *
 * @param {string[]} colors
 * @param {number} [count]
 * @returns {string[]}
 */
export function scale(colors, count = 10) {
	const stops = colors.map(c => toOklab(parse(c)))
	const segments = stops.length - 1
	const result = new Array(count)

	for (let k = 0; k < count; k++) {
		const t = count === 1 ? 0 : (k / (count - 1)) * segments
		const i = Math.min(segments - 1, Math.floor(t))
		const u = t - i
		const [L1, a1, b1, alpha1] = stops[i]
		const [L2, a2, b2, alpha2] = stops[i + 1]
		const L = L1 + (L2 - L1) * u
		const a = a1 + (a2 - a1) * u
		const b = b1 + (b2 - b1) * u
		const alpha = (alpha1 + (alpha2 - alpha1) * u) / 255
		result[k] = `oklab(${L} ${a} ${b} / ${alpha})`
	}

	return result
}

/**
 * Direct sRGB → OkLab conversion (Björn Ottosson's original formula).
 * Matrix constants are public-domain; published in the OkLab paper and
 * used verbatim by the CSS Color 4 spec.
 *
 * @param {Color} c
 * @returns {[number, number, number, number]} [L, a, b, alpha byte]
 */
function toOklab(c) {
	const r = sRGBtoLinear(getRed(c) / 255)
	const g = sRGBtoLinear(getGreen(c) / 255)
	const b = sRGBtoLinear(getBlue(c) / 255)

	const l = Math.cbrt(
		0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
	)
	const m = Math.cbrt(
		0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
	)
	const s = Math.cbrt(
		0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
	)

	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
		getAlpha(c),
	]
}

/**
 * sRGB gamma decode (CSS Color 4 piecewise formula).
 *
 * @param {number} v - channel in [0, 1]
 * @returns {number}
 */
function sRGBtoLinear(v) {
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Returns `white` or `black` depending on which contrasts better on
 * top of the given color.
 *
 * @param {string} color
 * @returns {'white' | 'black'}
 */
export function textColor(color) {
	const Ybg = apcaLuminance(parse(color))
	const onWhite = Math.abs(apcaContrast(APCA_Y_WHITE, Ybg))
	const onBlack = Math.abs(apcaContrast(APCA_Y_BLACK, Ybg))
	return onWhite > onBlack ? 'white' : 'black'
}

/**
 * Shades a color so that it remains readable on a black background.
 *
 * @param {string} color
 * @returns {string}
 */
export const textColorWhenBackgroundIsBlack = color =>
	textColorWhenBackgroundIs(color, true)

/**
 * Shades a color so that it remains readable on a white background.
 *
 * @param {string} color
 * @returns {string}
 */
export const textColorWhenBackgroundIsWhite = color =>
	textColorWhenBackgroundIs(color, false)

/**
 * Iteratively adjusts lightness so the color is legible on the chosen
 * background.
 *
 * @param {string} color
 * @param {boolean} black - When `true`, assumes a black background.
 * @returns {string}
 */
export function textColorWhenBackgroundIs(color, black) {
	let c = parse(color)
	const Ybg = black ? APCA_Y_BLACK : APCA_Y_WHITE
	let iterations = 0
	while (
		Math.abs(apcaContrast(apcaLuminance(c), Ybg)) < 60 &&
		iterations++ < 20
	) {
		c = black ? lighten(c, 0.05) : darken(c, 0.05)
	}
	return formatHEXA(c)
}

/**
 * Checks whether a string can be parsed as a valid color.
 *
 * @param {string} string
 * @returns {string | undefined} The original string when valid.
 */
export function validateColor(string) {
	try {
		parse(string)
		return string
	} catch (e) {}
}

/**
 * APCA (Accessible Perceptual Contrast Algorithm) — simplified polynomial,
 * W3-variant constants. Callers pass pre-clamped luminances from
 * `apcaLuminance` to avoid redundant work on constant backgrounds.
 * Reference: https://github.com/Myndex/apca-w3
 *
 * @param {number} Ytxt - text luminance from `apcaLuminance`
 * @param {number} Ybg  - background luminance from `apcaLuminance`
 * @returns {number} Lc in the [-108, 106] range
 */
function apcaContrast(Ytxt, Ybg) {
	if (Math.abs(Ybg - Ytxt) < 0.0005) return 0

	let sapc, output
	if (Ybg > Ytxt) {
		// Light bg, dark text
		sapc = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14
		output = sapc < 0.1 ? 0 : sapc - 0.027
	} else {
		// Dark bg, light text
		sapc = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14
		output = sapc > -0.1 ? 0 : sapc + 0.027
	}
	return output * 100
}

/**
 * APCA-ready luminance (with soft-clamp applied to near-black values).
 *
 * @param {Color} c
 * @returns {number}
 */
function apcaLuminance(c) {
	const r = getRed(c) / 255
	const g = getGreen(c) / 255
	const b = getBlue(c) / 255
	let Y =
		0.2126729 * Math.pow(r, 2.4) +
		0.7151522 * Math.pow(g, 2.4) +
		0.072175 * Math.pow(b, 2.4)
	if (Y < 0.022) Y += Math.pow(0.022 - Y, 1.414)
	return Y
}
