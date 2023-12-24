import { random } from './random.js'

/** Returns true or false with a `chance` of getting `true` */
export const rand = (chance = 50, generator = random) => {
	return generator() < chance / 100
}
