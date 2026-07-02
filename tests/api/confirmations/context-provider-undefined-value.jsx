/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: "`context`
// Provider with `value={undefined}` renders the context value
// instead of children". `useContext(newValue, fn)` dispatches on
// `newValue === undefined`, so the Provider falls into read mode,
// returns the current context value as JSX, and never calls the
// children thunk. Asserts the CURRENT buggy behavior.

import { test, body } from '#test'
import { context, render } from 'pota'

await test('CONFIRM - Provider value={undefined} drops children, renders context value', expect => {
	const theme = context('default-theme')

	const dispose = render(
		<theme.Provider value={undefined}>
			<p>child</p>
		</theme.Provider>,
	)

	// BUG: children are never rendered; the Provider returned the
	// read context value (the default) which renders as text
	expect(body()).toBe('default-theme')
	// FIXED: expect(body()).toBe('<p>child</p>')

	dispose()
})

await test('control - Provider with a value renders children and provides it', expect => {
	const theme = context('default-theme')

	const dispose = render(
		<theme.Provider value="dark">{() => <p>{theme()}</p>}</theme.Provider>,
	)

	expect(body()).toBe('<p>dark</p>')

	dispose()
})
