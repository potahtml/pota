import Color from 'colorjs.io'

export function setAlpha(color, alpha) {
	color = new Color(color)
	color.alpha = alpha
	return color.toString()
}
