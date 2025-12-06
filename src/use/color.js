import Color from 'colorjs.io'

import { window, isNaN, noop } from '../lib/std.js'

/**
 * Opens the browser EyeDropper API (when supported) and invokes the
 * callback with the picked color.
 *
 * @param {(hex: string) => void} cb
 * @returns {Promise<void> | void}
 */
export const eyeDropper = cb =>
	!window.EyeDropper
		? console.error('Your Browser Doesnt Support Picking Colors!')
		: /** @type {globalThis.EyeDropper} */ new window.EyeDropper()
				.open()
				.then(result => {
					cb(result.sRGBHex)
				})
				.catch(noop)

/** Given an array of colors it returns a gradient between them */
export function scale(colors, count) {
	const result = []
	let numPerColor = count / (colors.length - 1)

	for (let i = 0; i < colors.length - 1; i++) {
		const color = colors[i]
		const isLastColor = i === colors.length - 2

		// the last gradient may need more colors to fully fill
		if (isLastColor) {
			numPerColor = count - result.length
		}

		// get gradient
		const r = new Color(color).steps(colors[i + 1], {
			space: 'srgb',
			steps: numPerColor | 0,
		})

		// remove the last color as its going to be used on the next gradient
		// but only if isnt the last one
		if (!isLastColor) {
			r.pop()
		}

		// save
		result.push(...r)
	}

	return result.map(color => color.toString())
}

/**
 * Adjusts the alpha channel of a color string.
 *
 * @param {string} color
 * @param {number} alpha
 * @returns {string}
 */
export function setAlpha(color, alpha) {
	color = new Color(color)
	/** @ts-expect-error missing types */
	color.alpha = alpha
	return color.toString()
}

/**
 * Returns `white` or `black` depending on which contrasts better on
 * top of the given color.
 *
 * @param {string} color
 * @returns {'white' | 'black'}
 */
export function textColor(color) {
	const compare = new Color(color)
	const algo = 'APCA'
	let onWhite = Math.abs(compare.contrast('white', algo))
	let onBlack = Math.abs(compare.contrast('black', algo))
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
	const algo = 'APCA'
	const compare = new Color(color)
	let onWhite = Math.abs(compare.contrast('white', algo))
	let onBlack = Math.abs(compare.contrast('black', algo))
	let iterations = 0
	while (onWhite > onBlack) {
		compare.lch.l += black ? 5 : -5
		onWhite = Math.abs(compare.contrast('white', algo))
		onBlack = Math.abs(compare.contrast('black', algo))
		if (iterations++ > 20) break
	}
	return compare.toString()
}

/**
 * Checks whether a string can be parsed as a valid color.
 *
 * @param {string} string
 * @returns {string | undefined} The original string when valid.
 */
export function validateColor(string) {
	try {
		Color.parse(string)
		const color = new Color(string)
		if (
			isNaN(color.coords[0]) ||
			isNaN(color.coords[1]) ||
			isNaN(color.coords[2])
		) {
		} else {
			return string
		}
	} catch (e) {}
}
