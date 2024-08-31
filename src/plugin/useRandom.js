/** Returns true or false with a `chance` of getting `true` */
export const chance = (chance = 50, generator = random) => {
	return generator() < chance / 100
}

/** Returns random number between 0 and 1 */
export const random = () =>
	crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)

export const randomBetween = (min, max, generator = random) =>
	Math.floor(generator() * (max - min + 1)) + min

export const randomColor = (min = 0, max = 255) =>
	'rgb(' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	',' +
	randomBetween(min, max) +
	')'

export const randomId = () =>
	crypto.getRandomValues(new BigUint64Array(1))[0].toString(36)

/**
 * Returns a random number generator based no a seed that generates
 * numbers between 0 and 1
 */
export function randomSeeded(seed) {
	const m = 2 ** 35 - 31
	let s = seed % m
	return () => (s = (s * 185852) % m) / m
}
