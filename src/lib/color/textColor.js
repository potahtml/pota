import Color from 'colorjs.io'

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
