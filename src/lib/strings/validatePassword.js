import { toString } from './toString.js'

export function validatePassword(s) {
	s = toString(s)
	if (!s || s.length < 6) {
		return false
	}
	return s
}
