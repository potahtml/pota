/** @jsxImportSource pota */

// Tests for the Switch/Match components: exclusive branch selection,
// static and signal-driven switching, fallback prop vs no-when Match,
// callback accessor with reactive values, multiple truthy Matches,
// when:undefined behavior, empty children, nested Switch, and
// cleanup.
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

// --- Match with when: undefined acts as fallback ----------------------------

await test('Switch - Match with when undefined renders nothing', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={undefined}>
				<p>should not render</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('')

	dispose()
})

await test('Switch - Match without when prop acts as implicit fallback', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>fallback</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

// --- multiple truthy Matches: first wins ------------------------------------

await test('Switch - only the first truthy Match renders', expect => {
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>first</p>
			</Match>
			<Match when={true}>
				<p>second</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>first</p>')

	dispose()
})

// --- no-when Match before truthy Match: truthy wins -------------------------

await test('Switch - truthy Match wins even when no-when Match comes first', expect => {
	const dispose = render(
		<Switch>
			<Match>
				<p>fallback</p>
			</Match>
			<Match when={true}>
				<p>winner</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>winner</p>')

	dispose()
})

await test('Switch - no-when Match renders when all when-Matches are falsy', expect => {
	const dispose = render(
		<Switch>
			<Match>
				<p>fallback</p>
			</Match>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={false}>
				<p>b</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

await test('Switch - truthy Match becomes falsy, falls back to no-when Match', expect => {
	const active = signal(true)

	const dispose = render(
		<Switch>
			<Match when={active.read}>
				<p>active</p>
			</Match>
			<Match>
				<p>fallback</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>active</p>')

	active.write(false)
	expect(body()).toBe('<p>fallback</p>')

	active.write(true)
	expect(body()).toBe('<p>active</p>')

	dispose()
})

await test('Switch - no-when Match as sole child renders as fallback', expect => {
	const dispose = render(
		<Switch>
			<Match>
				<p>only child</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>only child</p>')

	dispose()
})

await test('Switch - multiple no-when Matches: first one wins', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>first fallback</p>
			</Match>
			<Match>
				<p>second fallback</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>first fallback</p>')

	dispose()
})

await test('Switch - no-when Match in the middle still acts as fallback', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>middle fallback</p>
			</Match>
			<Match when={false}>
				<p>b</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>middle fallback</p>')

	dispose()
})

await test('Switch - switching between truthy Matches never shows no-when fallback', expect => {
	const a = signal(true)
	const b = signal(false)

	const dispose = render(
		<Switch>
			<Match when={a.read}>
				<p>A</p>
			</Match>
			<Match when={b.read}>
				<p>B</p>
			</Match>
			<Match>
				<p>fallback</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>A</p>')

	a.write(false)
	b.write(true)
	expect(body()).toBe('<p>B</p>')

	b.write(false)
	a.write(true)
	expect(body()).toBe('<p>A</p>')

	// never showed fallback
	dispose()
})

// --- dynamic Match conditions switching simultaneously ----------------------

await test('Switch - dynamic conditions: switching which match is truthy', expect => {
	const a = signal(true)
	const b = signal(false)

	const dispose = render(
		<Switch fallback={<p>none</p>}>
			<Match when={a.read}>
				<p>A</p>
			</Match>
			<Match when={b.read}>
				<p>B</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>A</p>')

	a.write(false)
	b.write(true)
	expect(body()).toBe('<p>B</p>')

	b.write(false)
	expect(body()).toBe('<p>none</p>')

	dispose()
})

// --- callback receives non-boolean truthy when value -------------------------

await test('Switch - callback receives the actual when value, not just true', expect => {
	const user = signal({ name: 'Ada' })

	const dispose = render(
		<Switch>
			<Match when={user.read}>
				{v => <p>{() => v().name}</p>}
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>Ada</p>')

	user.write({ name: 'Grace' })
	expect(body()).toBe('<p>Grace</p>')

	dispose()
})

await test('Switch - callback receives numeric when value', expect => {
	const dispose = render(
		<Switch>
			<Match when={42}>
				{v => <p>{v()}</p>}
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>42</p>')

	dispose()
})

// --- empty Switch ------------------------------------------------------------

await test('Switch - empty children array renders fallback', expect => {
	const dispose = render(
		<Switch fallback={<p>empty</p>}>{[]}</Switch>,
	)

	expect(body()).toBe('<p>empty</p>')

	dispose()
})

// --- fallback prop makes no-when Match unreachable ---------------------------

await test('Switch - fallback prop makes no-when Match content unreachable', expect => {
	const dispose = render(
		<Switch fallback={<p>prop wins</p>}>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>no-when ignored</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>prop wins</p>')
	expect(body()).not.toInclude('no-when ignored')

	dispose()
})

// --- Switch with no matching Match transitioning to matched via signal --

await test('Switch - switching from no match to matched via signal', expect => {
	const value = signal(null)

	const dispose = render(
		<Switch fallback={<p>none</p>}>
			<Match when={() => value.read() === 'a'}>
				<p>A</p>
			</Match>
			<Match when={() => value.read() === 'b'}>
				<p>B</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>none</p>')

	value.write('a')
	expect(body()).toBe('<p>A</p>')

	value.write('b')
	expect(body()).toBe('<p>B</p>')

	value.write(null)
	expect(body()).toBe('<p>none</p>')

	dispose()
})

// --- Switch dispose cleans up ----------------------------------------

await test('Switch - dispose removes all rendered matches and fallbacks', expect => {
	const dispose = render(
		<Switch fallback={<p>fallback</p>}>
			<Match when={true}>
				<p>matched</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>matched</p>')

	dispose()

	expect(body()).toBe('')
})
