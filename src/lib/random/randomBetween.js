import { random } from './random.js'

export const randomBetween = (min, max, generator = random) =>
	Math.floor(generator() * (max - min + 1)) + min
