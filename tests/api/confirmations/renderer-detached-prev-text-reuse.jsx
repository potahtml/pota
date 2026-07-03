/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "a reactive child going
// string → function → string renders into a detached node". The
// function-child branch's cleanup removes its placeholder on the next
// re-run, but the effect still passed it as `prev`; the string
// branch's `prev instanceof Text` fast path wrote into the detached
// node, so the text never reached the document. Trigger: `Switch`
// losing its match content after showing the default fallback.
// Fixed: `prev` is reused only while it has a `parentNode`.

import { test, body } from '#test'
import { memo, render, signal } from 'pota'
import { Switch, Match } from 'pota/components'

await test('string → function child rendering nothing → string', expect => {
	const s = signal('first')
	const inner = () => undefined
	const outer = memo(() => (s.read() === 'fn' ? inner : s.read()))

	// render(fn) treats fn as a component; returning the memo from it
	// reaches the renderer's reactive-child path
	const dispose = render(() => outer)

	expect(body()).toBe('first')

	s.write('fn')
	expect(body()).toBe('')

	s.write('back')
	expect(body()).toBe('back')

	dispose()
})

await test('string → function child rendering content → string', expect => {
	const s = signal('first')
	const inner = () => 'inner content'
	const outer = memo(() => (s.read() === 'fn' ? inner : s.read()))

	const dispose = render(() => outer)

	expect(body()).toBe('first')

	s.write('fn')
	expect(body()).toBe('inner content')

	s.write('back')
	expect(body()).toBe('back')

	dispose()
})

await test('string → string keeps reusing the same Text node', expect => {
	const s = signal('a')
	const outer = memo(() => s.read())

	const dispose = render(() => outer)

	expect(body()).toBe('a')
	const first = document.body.firstChild

	s.write('b')
	expect(body()).toBe('b')
	expect(document.body.firstChild).toBe(first)

	dispose()
})

await test('Switch: match → empty default fallback → match again', expect => {
	const when = signal(true)

	const dispose = render(
		<Switch>
			<Match when={when.read}>matched</Match>
		</Switch>,
	)

	expect(body()).toBe('matched')

	when.write(false)
	expect(body()).toBe('')

	when.write(true)
	expect(body()).toBe('matched')

	dispose()
})
