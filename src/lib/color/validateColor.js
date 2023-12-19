import Color from 'colorjs.io'

import { isNaN } from '../std/isNaN.js'

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
