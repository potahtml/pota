import { randomBetween } from './randomBetween.js'

export function randomColor(min = 0, max = 255) {
	return (
		'rgb(' +
		randomBetween(min, max) +
		',' +
		randomBetween(min, max) +
		',' +
		randomBetween(min, max) +
		')'
	)
}
