/** @jsxImportSource pota */

// Tests for the Switch/Match components: exclusive branch selection,
// static and signal-driven switching, fallback, callback accessor,
// no-when fallback Match, and cleanup.
//
// Note: the children callback receives a memo accessor — call v() or
// pass {v} reactively; both produce the current `when` value.
import { test, body } from '#test'

import { render, signal } from 'pota'
import { Switch, Match } from 'pota/components'

// --- static rendering -------------------------------------------------------

await test('Switch - renders fallback when no Match is truthy', expect => {
	const dispose = render(
		<Switch fallback={<p>fallback</p>}>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={0}>
				<p>b</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>fallback</p>')
	dispose()
})

await test('Switch - renders string fallback', expect => {
	const dispose = render(
		<Switch fallback="nothing">
			<Match when={false}>a</Match>
		</Switch>,
	)
	expect(body()).toBe('nothing')
	dispose()
})

await test('Switch - renders nothing when no fallback and no match', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('')
	dispose()
})

await test('Switch - first truthy Match wins, subsequent truthy Matches are ignored', expect => {
	const dispose = render(
		<Switch fallback="none">
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={true}>
				<p>b</p>
			</Match>
			<Match when={true}>
				<p>c</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>b</p>')
	dispose()
})

await test('Switch - falsy when values (false, 0, null, undefined) do not match', expect => {
	const dispose = render(
		<Switch fallback="fb">
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={0}>
				<p>b</p>
			</Match>
			<Match when={null}>
				<p>c</p>
			</Match>
			<Match when={undefined}>
				<p>d</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('fb')
	dispose()
})

await test('Switch - truthy when values (true, 1, non-empty string) all match', expect => {
	const trueDispose = render(
		<Switch>
			<Match when={true}>
				<p>yes</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>yes</p>')
	trueDispose()

	const oneDispose = render(
		<Switch>
			<Match when={1}>
				<p>yes</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>yes</p>')
	oneDispose()

	const strDispose = render(
		<Switch>
			<Match when="ok">
				<p>yes</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>yes</p>')
	strDispose()
})

await test('Switch - Match renders multiple children', expect => {
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>a</p>
				<p>b</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

// --- callback receives accessor ---------------------------------------------

await test('Switch - Match callback receives the when value as an accessor', expect => {
	const dispose = render(
		<Switch>
			<Match when={42}>{v => <p>{v()}</p>}</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>42</p>')
	dispose()
})

await test('Switch - Match callback: passing {v} reactively also renders the value', expect => {
	const dispose = render(
		<Switch>
			<Match when="hello">{v => <p>{v}</p>}</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>hello</p>')
	dispose()
})

// --- no-when Match as fallback branch --------------------------------------

await test('Switch - Match without when prop acts as internal fallback', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>default</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>default</p>')
	dispose()
})

await test('Switch - truthy Match takes priority over no-when Match', expect => {
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>matched</p>
			</Match>
			<Match>
				<p>default</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>matched</p>')
	dispose()
})

// --- signal reactivity -------------------------------------------------------

await test('Switch - updates when signal changes Match condition', expect => {
	const [val, setVal] = signal(false)
	const dispose = render(
		<Switch fallback={<p>fallback</p>}>
			<Match when={val}>
				<p>matched</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>fallback</p>')
	setVal(true)
	expect(body()).toBe('<p>matched</p>')
	dispose()
})

await test('Switch - reverts to fallback when signal becomes false', expect => {
	const [val, setVal] = signal(true)
	const dispose = render(
		<Switch fallback={<p>fallback</p>}>
			<Match when={val}>
				<p>matched</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>matched</p>')
	setVal(false)
	expect(body()).toBe('<p>fallback</p>')
	dispose()
})

await test('Switch - switches between Matches via derived signals', expect => {
	const [val, setVal] = signal(0)
	const dispose = render(
		<Switch fallback={<p>none</p>}>
			<Match when={() => val() === 1}>
				<p>one</p>
			</Match>
			<Match when={() => val() === 2}>
				<p>two</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>none</p>')
	setVal(1)
	expect(body()).toBe('<p>one</p>')
	setVal(2)
	expect(body()).toBe('<p>two</p>')
	setVal(0)
	expect(body()).toBe('<p>none</p>')
	dispose()
})

await test('Switch - accessor value passed to callback updates reactively', expect => {
	const [val, setVal] = signal(10)
	const dispose = render(
		<Switch>
			<Match when={val}>{v => <p>{v}</p>}</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>10</p>')
	setVal(20)
	expect(body()).toBe('<p>20</p>')
	dispose()
})

await test('Switch - toggles multiple times', expect => {
	const [val, setVal] = signal(true)
	const dispose = render(
		<Switch fallback={<p>off</p>}>
			<Match when={val}>
				<p>on</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>on</p>')
	setVal(false)
	expect(body()).toBe('<p>off</p>')
	setVal(true)
	expect(body()).toBe('<p>on</p>')
	setVal(false)
	expect(body()).toBe('<p>off</p>')
	dispose()
})

// --- fallback prop vs no-when Match priority ------------------------------------

await test('Switch - fallback prop takes priority over a no-when Match', expect => {
	const dispose = render(
		<Switch fallback={<p>prop-fb</p>}>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>no-when-fb</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>prop-fb</p>')
	dispose()
})

// --- nested Switch -------------------------------------------------------------

await test('Switch - nested Switch renders independently', expect => {
	const dispose = render(
		<Switch>
			<Match when={true}>
				<Switch fallback={<p>inner-fb</p>}>
					<Match when={false}>
						<p>inner-a</p>
					</Match>
				</Switch>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>inner-fb</p>')
	dispose()
})

await test('Switch - nested Switch reacts to signal changes in inner and outer', expect => {
	const [outer, setOuter] = signal(1)
	const [inner, setInner] = signal('x')
	const dispose = render(
		<Switch fallback={<p>outer-fb</p>}>
			<Match when={() => outer() === 1}>
				<Switch fallback={<p>inner-fb</p>}>
					<Match when={() => inner() === 'x'}>
						<p>x</p>
					</Match>
					<Match when={() => inner() === 'y'}>
						<p>y</p>
					</Match>
				</Switch>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>x</p>')
	setInner('y')
	expect(body()).toBe('<p>y</p>')
	setInner('z')
	expect(body()).toBe('<p>inner-fb</p>')
	setOuter(0)
	expect(body()).toBe('<p>outer-fb</p>')
	setOuter(1)
	expect(body()).toBe('<p>inner-fb</p>')
	dispose()
})

// --- reactive fallback ---------------------------------------------------------

await test('Switch - fallback can be a reactive function', expect => {
	const [fb, setFb] = signal('loading')
	const dispose = render(
		<Switch fallback={<p>{fb}</p>}>
			<Match when={false}>
				<p>a</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>loading</p>')
	setFb('timeout')
	expect(body()).toBe('<p>timeout</p>')
	dispose()
})

// --- single Match (not wrapped in array) ----------------------------------------

await test('Switch - works with a single Match child (no array)', expect => {
	const dispose = render(
		<Switch fallback={<p>fb</p>}>
			<Match when={true}>
				<p>only</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>only</p>')
	dispose()
})

// --- cleanup ----------------------------------------------------------------

await test('Switch - cleans up on dispose', expect => {
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>content</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>content</p>')
	dispose()
	expect(body()).toBe('')
})
