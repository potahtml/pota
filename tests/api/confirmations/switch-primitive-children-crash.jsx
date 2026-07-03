/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "`Switch` with primitive
// children crashes the default fallback". The fallback finder applied
// `'when' in match` to every resolved child — a string/number child
// threw `Cannot use 'in' operator` when no Match matched and
// `fallback` was nullish (and a null child crashed the match finder).
// Fixed: both probes guard with isObject; a primitive child acts as
// fallback content itself.

import { test, body } from '#test'
import { signal, render } from 'pota'
import { Switch, Match } from 'pota/components'

await test('Switch with a text child uses it as fallback content', expect => {
	const dispose = render(
		<Switch>
			plain text
			<Match when={() => false}>never</Match>
		</Switch>,
	)

	expect(body()).toBe('plain text')

	dispose()
})

await test('a matching Match still wins over the primitive fallback', expect => {
	const when = signal(false)

	const dispose = render(
		<Switch>
			plain text
			<Match when={when.read}>matched</Match>
		</Switch>,
	)

	expect(body()).toBe('plain text')

	when.write(true)
	expect(body()).toBe('matched')

	when.write(false)
	expect(body()).toBe('plain text')

	dispose()
})

await test('null children do not crash the finders', expect => {
	const dispose = render(
		<Switch>
			{null}
			<Match when={() => false}>never</Match>
		</Switch>,
	)

	// nothing matches, the null child is the (empty) fallback
	expect(body()).toBe('')

	dispose()
})

await test('control - with an explicit fallback prop text children are tolerated', expect => {
	const dispose = render(
		<Switch fallback={<p>fb</p>}>
			plain text
			<Match when={() => false}>never</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>fb</p>')

	dispose()
})
