import Color from 'colorjs.io'

import { isNaN, noop, window } from '../lib/std.js'

export const eyeDropper = cb =>
	!window.EyeDropper
		? console.error('Your Browser Doesnt Support Picking Colors!')
		: new EyeDropper()
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
		const isLastColor = i === color.length - 2

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

export function setAlpha(color, alpha) {
	color = new Color(color)
	color.alpha = alpha
	return color.toString()
}

// returns `white` or `black` when `color` is background
export function textColor(color) {
	const compare = new Color(color)
	const algo = 'APCA'
	let onWhite = Math.abs(compare.contrast('white', algo))
	let onBlack = Math.abs(compare.contrast('black', algo))
	return onWhite > onBlack ? 'white' : 'black'
}

// returns shaded color to be readable on black
export const textColorWhenBackgroundIsBlack = color =>
	textColorWhenBackgroundIs(color, true)

// returns shaded color to be readable on white
export const textColorWhenBackgroundIsWhite = color =>
	textColorWhenBackgroundIs(color, false)

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
