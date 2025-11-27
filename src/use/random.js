/** Returns true or false with a `chance` of getting `true` */
export const chance = (chance = 50, generator = random) => {
	return generator() < chance / 100
}

/** Returns random number between 0 and 1 */
export const random = () =>
	crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)

/**
 * Returns an integer between `min` and `max` (inclusive) using the
 * provided generator.
 *
 * @param {number} [min=0] Lowest value in the range. Default is `0`
 * @param {number} [max=100] Highest value in the range. Default is
 *   `100`
 * @param {() => number} [generator=random] Source of uniform floats
 *   between 0 and 1. Default is `random`
 * @returns {number}
 */
export const randomBetween = (
	min = 0,
	max = 100,
	generator = random,
) => Math.floor(generator() * (max - min + 1)) + min

/**
 * Creates an RGB color string by sampling each channel in the
 * [min,max] range.
 *
 * @param {number} [min=0] Lowest channel value. Default is `0`
 * @param {number} [max=255] Highest channel value. Default is `255`
 * @returns {string}
 */
export const randomColor = (min = 0, max = 255) =>
	'rgb(' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	')'

/**
 * Generates a base36 id string by reading 64 bits from `crypto`.
 *
 * @returns {string}
 */
export const randomId = () =>
	crypto.getRandomValues(new BigUint64Array(1))[0].toString(36)

/**
 * Returns a random number generator based on a seed that generates
 * numbers between 0 and 1
 *
 * @param {number} seed
 */
export function randomSeeded(seed) {
	const m = 2 ** 35 - 31
	let s = seed % m
	return () => (s = (s * 185852) % m) / m
}
