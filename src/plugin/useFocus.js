import {
	activeElement,
	document,
	querySelectorAll,
	toArray,
} from '../lib/std.js'

const elements = () =>
	toArray(
		querySelectorAll(
			document,
			'input:not([type=hidden]), button, select, textarea, a, [tabindex]',
		),
	)

export function focusNext() {
	const all = elements()

	const element = all[all.indexOf(activeElement()) + 1] || all[0]
	element && element.focus()
}

export function focusPrevious() {
	const all = elements()

	const element =
		all[all.indexOf(activeElement()) - 1] || all[all.length - 1]
	element && element.focus()
}
