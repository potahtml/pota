import { hasOwnProperty } from './hasOwnProperty.js'

// returns true for keys that shouldnt be transformed into getters/setters
export function isPrototypeProperty(target, key) {
	return (
		// must do `key in target` to check that it DOES have it somewhere
		// must do !hasOwnProperty to check that isnt an own property
		key in target && !hasOwnProperty(target, key)
	)
}
