import { hasOwnProperty } from './hasOwnProperty.js'

// returns true for keys that shouldnt be transformed into getters/setters
export const isPrototypeProperty = (target, key) =>
	// must do `key in target` to check that it DOES have it somewhere
	// must do !hasOwnProperty to check that isnt an own property
	key in target && !hasOwnProperty(target, key)
