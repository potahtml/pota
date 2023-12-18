import { toString } from './toString.js'

export function validateEmail(s) {
	// a@a.uy
	s = toString(s).toLowerCase()
	if (!s || s.length < 6 || !/^[^@]+@[^@]+\.[^@]+$/.test(s)) {
		return false
	}
	return s
}
