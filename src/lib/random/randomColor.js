import { randomBetween } from './randomBetween.js'

export const randomColor = (min = 0, max = 255) =>
	'rgb(' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	')'
