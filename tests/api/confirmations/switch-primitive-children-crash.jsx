/** @jsxImportSource pota */
// BUG CONFIRMATION — documentation/improvements.md: "`Switch` with
// primitive children crashes the default fallback". The fallback
// finder applies `'when' in match` to every resolved child — a
// string/number child makes it throw `Cannot use 'in' operator` when
// no Match matches and `fallback` is nullish. Asserts the CURRENT
// buggy behavior (the error routes to the boundary).

import { test, body } from '#test'
import { render } from 'pota'
import { Switch, Match, Errored } from 'pota/components'

await test('CONFIRM - Switch with a text child and no fallback prop crashes', expect => {
	const errors = []

	const dispose = render(
		<Errored
			fallback={err => {
				errors.push(err instanceof Error ? err.message : String(err))
				return null
			}}
		>
			<Switch>
				plain text
				<Match when={() => false}>never</Match>
			</Switch>
		</Errored>,
	)

	// BUG: `'when' in 'plain text'` throws TypeError
	expect(errors.length).toBe(1)
	expect(errors[0]).toInclude("'in' operator")
	expect(body()).toBe('')
	// FIXED: no error; the text child acts as fallback content

	dispose()
})

await test('control - with an explicit fallback prop text children are tolerated', expect => {
	const dispose = render(
		<Switch fallback={<p>fb</p>}>
			plain text
			<Match when={() => false}>never</Match>
		</Switch>,
	)

	// the crashing code path (default-fallback finder) never runs
	expect(body()).toBe('<p>fb</p>')

	dispose()
})
