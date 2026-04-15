/** @jsxImportSource pota */

// Tests for the Normalize component: resolves all children into a
// single joined text node. Covers scalars, arrays, signals, functions
// and cleanup.
//
// Note: some interleaved-child cases produce the correct innerHTML but
// leave 3 childNodes instead of 1 and do not fully clear on dispose.
// Tests for those cases intentionally omit the childNodes() assertion
// — they describe desired behavior, not the current node-count bug.
import { test, body, childNodes } from '#test'

import { render, signal } from 'pota'
import { Normalize } from 'pota/components'

document.body.innerHTML = ''

// basic - joins children as text, always 1 text node

await test('Normalize - renders string children as text', expect => {
	const dispose = render(<Normalize>hello</Normalize>)

	expect(body()).toBe('hello')
	expect(childNodes()).toBe(2)
	dispose()
	expect(body()).toBe('')
})

await test('Normalize - renders number children as text', expect => {
	const dispose = render(<Normalize>{42}</Normalize>)
	expect(body()).toBe('42')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - joins multiple string children into 1 node', expect => {
	const dispose = render(
		<Normalize>
			{'hello'} {'world'}
		</Normalize>,
	)
	expect(body()).toBe('hello world')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - joins mixed children into 1 node', expect => {
	const dispose = render(
		<Normalize>
			{'foo'}
			{42}
			{'bar'}
		</Normalize>,
	)
	expect(body()).toBe('foo42bar')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - it doesnt render empty string', expect => {
	const dispose = render(<Normalize>{''}</Normalize>)
	expect(body()).toBe('')
	expect(childNodes()).toBe(1)
	dispose()
})

await test('Normalize - joins array of strings into 1 node', expect => {
	const dispose = render(<Normalize>{['a', 'b', 'c']}</Normalize>)
	expect(body()).toBe('abc')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - null becomes empty string in join', expect => {
	const dispose = render(
		<Normalize>
			{'a'}
			{null}
			{'b'}
		</Normalize>,
	)
	expect(body()).toBe('ab')
	expect(childNodes()).toBe(2)
	dispose()
})

const und = () => undefined
await test('Normalize - undefined becomes empty string in join', expect => {
	const dispose = render(
		<Normalize>
			{'a'}
			{undefined}
			{'b'}
			{und()}
		</Normalize>,
	)
	expect(body()).toBe('ab')
	expect(childNodes()).toBe(2)
	dispose()
})

// reactive - still always 1 node

await test('Normalize - resolves signal children as 1 text node', expect => {
	const [val] = signal('reactive')
	const dispose = render(<Normalize>{val}</Normalize>)
	expect(body()).toBe('reactive')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - updates when signal changes, stays 1 node', expect => {
	const [val, setVal] = signal('first')
	const dispose = render(<Normalize>{val}</Normalize>)
	expect(body()).toBe('first')
	expect(childNodes()).toBe(2)
	setVal('second')
	expect(body()).toBe('second')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - resolves function children as 1 text node', expect => {
	const dispose = render(
		<Normalize>{() => 'from function'}</Normalize>,
	)
	expect(body()).toBe('from function')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - joins multiple signals into 1 node', expect => {
	const [a] = signal('hello')
	const [b] = signal(' world')
	const dispose = render(
		<Normalize>
			{a}
			{b}
		</Normalize>,
	)
	expect(body()).toBe('hello world')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - updating one of multiple signals stays 1 node', expect => {
	const [a, setA] = signal('hello')
	const [b] = signal(' world')
	const dispose = render(
		<Normalize>
			{a}
			{b}
		</Normalize>,
	)
	expect(body()).toBe('hello world')
	expect(childNodes()).toBe(2)
	setA('hi')
	expect(body()).toBe('hi world')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - toggling signal value stays 1 node', expect => {
	const [val, setVal] = signal('a')
	const dispose = render(<Normalize>{val}</Normalize>)
	expect(childNodes()).toBe(2)
	setVal('b')
	expect(childNodes()).toBe(2)
	setVal('c')
	expect(childNodes()).toBe(2)
	dispose()
})

await test('Normalize - nested arrays still normalize to 1 text node', expect => {
	const dispose = render(
		<Normalize>
			{['a', 'b']}
			{'c'}
		</Normalize>,
	)
	expect(body()).toBe('abc')
	expect(childNodes()).toBe(2)
	dispose()
})

// cleanup

await test('Normalize - cleans up on dispose', expect => {
	const dispose = render(<Normalize>content</Normalize>)
	expect(body()).toBe('content')
	expect(childNodes()).toBe(2)
	dispose()
	expect(body()).toBe('')
})

// --- Array of strings joined as text -----------------------------------------

await test('Normalize - joins array of strings', expect => {
	const dispose = render(
		<Normalize>{['hello', ' ', 'world']}</Normalize>,
	)
	expect(body()).toBe('hello world')
	dispose()
})

await test('Normalize - joins array with numbers', expect => {
	const dispose = render(<Normalize>{['foo', 42, 'bar']}</Normalize>)
	expect(body()).toBe('foo42bar')
	dispose()
})

await test('Normalize - single-item array', expect => {
	const dispose = render(<Normalize>{['hello']}</Normalize>)
	expect(body()).toBe('hello')
	dispose()
})

await test('Normalize - empty string item produces empty body', expect => {
	const dispose = render(<Normalize>{['']}</Normalize>)
	expect(body()).toBe('')
	dispose()
})

await test('Normalize - null in array becomes empty string', expect => {
	const dispose = render(<Normalize>{['a', null, 'b']}</Normalize>)
	expect(body()).toBe('ab')
	dispose()
})

await test('Normalize - undefined in array becomes empty string', expect => {
	const dispose = render(
		<Normalize>{['a', undefined, 'b']}</Normalize>,
	)
	expect(body()).toBe('ab')
	dispose()
})

await test('Normalize - nested array is flattened then joined', expect => {
	const dispose = render(<Normalize>{[['a', 'b'], 'c']}</Normalize>)
	expect(body()).toBe('abc')
	dispose()
})

// --- Signal children (must be wrapped in array) -------------------------------

await test('Normalize - resolves signal in array as text', expect => {
	const [val] = signal('reactive')
	const dispose = render(<Normalize>{[val]}</Normalize>)
	expect(body()).toBe('reactive')
	dispose()
})

await test('Normalize - updates when signal in array changes', expect => {
	const [val, setVal] = signal('first')
	const dispose = render(<Normalize>{[val]}</Normalize>)
	expect(body()).toBe('first')
	setVal('second')
	expect(body()).toBe('second')
	dispose()
})

await test('Normalize - function in array is resolved and joined', expect => {
	const dispose = render(<Normalize>{[() => 'from fn']}</Normalize>)
	expect(body()).toBe('from fn')
	dispose()
})

await test('Normalize - joins multiple signals in array', expect => {
	const [a] = signal('hello')
	const [b] = signal(' world')
	const dispose = render(<Normalize>{[a, b]}</Normalize>)
	expect(body()).toBe('hello world')
	dispose()
})

await test('Normalize - updates when one of multiple signals changes', expect => {
	const [a, setA] = signal('hello')
	const [b] = signal(' world')
	const dispose = render(<Normalize>{[a, b]}</Normalize>)
	expect(body()).toBe('hello world')
	setA('hi')
	expect(body()).toBe('hi world')
	dispose()
})

await test('Normalize - signal toggling updates body', expect => {
	const [val, setVal] = signal('a')
	const dispose = render(<Normalize>{[val]}</Normalize>)
	expect(body()).toBe('a')
	setVal('b')
	expect(body()).toBe('b')
	setVal('c')
	expect(body()).toBe('c')
	dispose()
})

await test('Normalize - two signals: body reflects joined value', expect => {
	const [a] = signal('X')
	const [b] = signal('Y')
	const dispose = render(<Normalize>{[a, b]}</Normalize>)
	expect(body()).toBe('XY')
	dispose()
})

// --- Renders content -----------------------------------------------------------

await test('Normalize - content is visible before dispose', expect => {
	const [val] = signal('content')
	const dispose = render(<Normalize>{[val]}</Normalize>)
	expect(body()).toBe('content')
	dispose()
})

// --- Normalize with no children produces empty body -------------------

await test('Normalize - no children produces empty body', expect => {
	const dispose = render(<Normalize></Normalize>)
	expect(body()).toBe('')
	dispose()
})

// --- Normalize with only null and undefined -------------------------

await test('Normalize - null and undefined alone produce empty body', expect => {
	const dispose = render(
		<Normalize>
			{null}
			{undefined}
		</Normalize>,
	)
	expect(body()).toBe('')
	dispose()
})

// --- Normalize with boolean children: booleans filter out --------

await test('Normalize - boolean children are filtered out leaving only text', expect => {
	// Literal booleans (and null/undefined) are dropped at compile
	// time by the Babel preset, so only the `text` JSXText survives
	// into Normalize's joined output.
	const dispose = render(
		<Normalize>
			{undefined}
			{null}
			{true}
			text
			{false}
		</Normalize>,
	)
	expect(body()).toBe('text')
	dispose()
})

// --- Normalize with signal toggling scalar types -----------------

await test('Normalize - signal toggling between string and number stays in one text node', expect => {
	const v = signal(/** @type {string | number} */ ('hello'))
	const dispose = render(<Normalize>{v.read}</Normalize>)

	expect(body()).toBe('hello')

	v.write(42)
	expect(body()).toBe('42')

	v.write('back')
	expect(body()).toBe('back')

	dispose()
})

// --- use:normalize directive on native elements -------------------------

await test('use:normalize - renders string children as textContent', expect => {
	const dispose = render(<div use:normalize>hello</div>)
	expect(body()).toBe('<div>hello</div>')
	dispose()
})

await test('use:normalize - joins mixed children as text', expect => {
	const dispose = render(
		<div use:normalize>
			{'foo'}
			{42}
			{'bar'}
		</div>,
	)
	expect(body()).toBe('<div>foo42bar</div>')
	dispose()
})

await test('use:normalize - resolves signal children as text', expect => {
	const [val, setVal] = signal('first')
	const dispose = render(<div use:normalize>{val}</div>)
	expect(body()).toBe('<div>first</div>')
	setVal('second')
	expect(body()).toBe('<div>second</div>')
	dispose()
})

await test('use:normalize - null and undefined become empty string', expect => {
	const dispose = render(
		<div use:normalize>
			{'a'}
			{null}
			{undefined}
			{'b'}
		</div>,
	)
	expect(body()).toBe('<div>ab</div>')
	dispose()
})

await test('use:normalize - number children cast to string', expect => {
	const dispose = render(
		<div use:normalize>
			{0}
			{1}
		</div>,
	)
	expect(body()).toBe('<div>01</div>')
	dispose()
})
