/** @jsxImportSource pota */

// Tests for JSX children coercion in the Babel preset.
//
// Summary of the contract these tests enforce:
//
// 1. Literal JSX children that render as nothing — booleans, `null`,
//    `undefined`, and `void 0` — are filtered out at compile time.
//    `<Comp>{true}</Comp>` and `<Comp>{true}{false}</Comp>` compile
//    down to `<Comp/>` (no children prop at all).
//
// 2. Literal string / number children still flatten to a single
//    `StringLiteral` on the component's `children` prop. Adjacent
//    string/number runs merge into one string. Negative numbers are
//    flattened too.
//
// 3. Mixed-sibling groups preserve the dynamic parts and merge only
//    the adjacent literal runs around them. Boolean/null/undefined
//    literal entries in the mix are dropped before the merge runs.
//
// 4. Dynamic booleans at runtime (e.g. `{cond && <X/>}` short-circuits)
//    are also suppressed — the renderer's `createChildren` catches
//    the primitive `true` / `false` and renders nothing.
//
// 5. The attribute form `<Comp children={...}/>` is not touched by the
//    children transform at all — it passes the value through as-is, so
//    real booleans / null / arrays reach the component unchanged.
//
// Authors who need complex `children` shapes (arrays, real booleans,
// reactive accessors on their own) use the attribute form; the
// JSX-children syntax is for markup.

import { test, body } from '#test'
import { render, signal } from 'pota'

document.body.innerHTML = ''

/**
 * Captures `props.children` so tests can assert on its runtime type
 * and value. Returns null so nothing lands in the DOM.
 *
 * @type {any}
 */
let captured
function Inspect(props) {
	captured = props.children
	return null
}

// --- single-child literal filtering ------------------------------------

await test('children - single boolean true literal is filtered out', expect => {
	captured = undefined
	const dispose = render(<Inspect>{true}</Inspect>)
	// entire JSX child is dropped at compile time, so the component
	// is called with no props at all
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - single boolean false literal is filtered out', expect => {
	captured = undefined
	const dispose = render(<Inspect>{false}</Inspect>)
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - single null literal is filtered out', expect => {
	captured = undefined
	const dispose = render(<Inspect>{null}</Inspect>)
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - single undefined literal is filtered out', expect => {
	captured = undefined
	const dispose = render(<Inspect>{undefined}</Inspect>)
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - single void 0 is filtered out', expect => {
	captured = undefined
	const dispose = render(<Inspect>{void 0}</Inspect>)
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - single string literal passes through as string', expect => {
	captured = undefined
	const dispose = render(<Inspect>{'hello'}</Inspect>)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('hello')
	dispose()
})

await test('children - single number literal flattens to its decimal form', expect => {
	captured = undefined
	const dispose = render(<Inspect>{42}</Inspect>)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('42')
	dispose()
})

await test('children - single negative number literal flattens to signed decimal', expect => {
	captured = undefined
	const dispose = render(<Inspect>{-3}</Inspect>)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('-3')
	dispose()
})

// --- adjacent-literal merging / filtering ------------------------------

await test('children - adjacent {true}{false} filters out and produces no children', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{true}
			{false}
		</Inspect>,
	)
	expect(captured).toBe(undefined)
	dispose()
})

await test('children - {undefined}{null}{true}text{false} collapses to just "text"', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{undefined}
			{null}
			{true}
			text
			{false}
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('text')
	dispose()
})

await test('children - JSX text followed by booleans keeps only the text', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			hello
			{true}
			{false}
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('hello')
	dispose()
})

await test('children - null preceding JSX text drops and flattens to "text"', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{null}
			text
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('text')
	dispose()
})

await test('children - undefined preceding JSX text drops and flattens to "text"', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{undefined}
			text
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('text')
	dispose()
})

await test('children - adjacent numbers merge to concatenated decimal string', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{1}
			{2}
			{3}
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('123')
	dispose()
})

await test('children - string and boolean literals merge to only the string parts', expect => {
	captured = undefined
	const dispose = render(
		<Inspect>
			{'a'}
			{true}
			{'b'}
			{false}
		</Inspect>,
	)
	expect(typeof captured).toBe('string')
	expect(captured).toBe('ab')
	dispose()
})

// --- attribute form preserves real JS values ---------------------------

await test('children - attribute form preserves an array of mixed values', expect => {
	captured = undefined
	const dispose = render(
		<Inspect
			children={['hello', true, false, null, undefined, 42]}
		/>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(6)
	expect(captured[0]).toBe('hello')
	expect(captured[1]).toBe(true)
	expect(captured[2]).toBe(false)
	expect(captured[3]).toBe(null)
	expect(captured[4]).toBe(undefined)
	expect(captured[5]).toBe(42)
	dispose()
})

await test('children - attribute form preserves a single boolean true', expect => {
	captured = undefined
	const dispose = render(<Inspect children={true} />)
	expect(typeof captured).toBe('boolean')
	expect(captured).toBe(true)
	dispose()
})

await test('children - attribute form preserves a single boolean false', expect => {
	captured = undefined
	const dispose = render(<Inspect children={false} />)
	expect(typeof captured).toBe('boolean')
	expect(captured).toBe(false)
	dispose()
})

await test('children - attribute form preserves null', expect => {
	captured = undefined
	const dispose = render(<Inspect children={null} />)
	expect(captured).toBe(null)
	dispose()
})

// --- native tag parity ------------------------------------------------

// The JSX-children form on a native tag must produce the same output
// as the same JSX rendered through a component: booleans and
// null/undefined literals are filtered out, leaving only text/numbers.

await test('children - native tag parity: {true}{false} renders empty', expect => {
	const dispose = render(
		<div>
			{true}
			{false}
		</div>,
	)
	expect(body()).toBe('<div></div>')
	dispose()
})

await test('children - native tag parity: undefined/null/true/text/false collapses to "text"', expect => {
	const dispose = render(
		<div>
			{undefined}
			{null}
			{true}
			text
			{false}
		</div>,
	)
	expect(body()).toBe('<div>text</div>')
	dispose()
})

await test('children - native tag parity: hello{true}{false} renders "hello"', expect => {
	const dispose = render(
		<div>
			hello
			{true}
			{false}
		</div>,
	)
	expect(body()).toBe('<div>hello</div>')
	dispose()
})

await test('children - native tag parity: single {true} renders empty', expect => {
	const dispose = render(<div>{true}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

await test('children - native tag parity: single {null} renders empty', expect => {
	const dispose = render(<div>{null}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

await test('children - native tag parity: single {undefined} renders empty', expect => {
	const dispose = render(<div>{undefined}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

// --- dynamic booleans are suppressed at runtime too -------------------

// Booleans that Babel cannot constant-fold (e.g. results of short-
// circuit `&&` / `||` with runtime-resolved conditions) are caught
// by the renderer's boolean case in createChildren. The compile path
// cannot filter them out, but the runtime path does.

await test('children - dynamic false && X renders nothing', expect => {
	// `false` here is a literal, but `false && <span/>` is a
	// LogicalExpression that Babel does not fold — so it compiles
	// to a runtime expression that evaluates to `false`.
	const dispose = render(<div>{false && <span>hidden</span>}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

await test('children - dynamic true && X renders X', expect => {
	const dispose = render(<div>{true && <span>shown</span>}</div>)
	expect(body()).toBe('<div><span>shown</span></div>')
	dispose()
})

await test('children - variable cond && X — false branch renders nothing', expect => {
	const cond = false
	const dispose = render(<div>{cond && <span>hidden</span>}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

await test('children - variable cond && X — true branch renders X', expect => {
	const cond = true
	const dispose = render(<div>{cond && <span>shown</span>}</div>)
	expect(body()).toBe('<div><span>shown</span></div>')
	dispose()
})

await test('children - ternary with null false branch renders nothing', expect => {
	const cond = false
	const dispose = render(<div>{cond ? <span>x</span> : null}</div>)
	expect(body()).toBe('<div></div>')
	dispose()
})

// --- mixed literal + dynamic children ---------------------------------

// A dynamic expression interrupts the literal-merging run. String /
// number literals before and after it merge within their own group,
// booleans in the mix are dropped, and the dynamic value flows
// through unchanged.

await test('children - dynamic expression between literals keeps dynamic part live', expect => {
	captured = undefined
	const label = signal('world')
	const dispose = render(<Inspect>hello {label.read} !</Inspect>)
	// literal runs merge into strings, label.read is the accessor
	// function in the middle — children becomes an array of parts.
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(3)
	expect(captured[0]).toBe('hello ')
	expect(typeof captured[1]).toBe('function')
	expect(captured[2]).toBe(' !')
	dispose()
})

await test('children - boolean literals before a dynamic expression are dropped', expect => {
	captured = undefined
	const label = signal('x')
	const dispose = render(
		<Inspect>
			{true}
			{false}
			{label.read}
		</Inspect>,
	)
	// {true}{false} is filtered out entirely — only the dynamic
	// remains, so children collapses to the accessor function.
	expect(typeof captured).toBe('function')
	expect(captured).toBe(label.read)
	dispose()
})

await test('children - single dynamic expression passes through unchanged', expect => {
	captured = undefined
	const label = signal('x')
	const dispose = render(<Inspect>{label.read}</Inspect>)
	expect(typeof captured).toBe('function')
	expect(captured).toBe(label.read)
	dispose()
})

// --- attribute-form + JSX-children parity on the receiving component ---

function PassThrough(props) {
	return <div>{props.children}</div>
}

await test('children - PassThrough with JSX-children literal group renders merged text only', expect => {
	const dispose = render(
		<PassThrough>
			{true}
			text
			{false}
		</PassThrough>,
	)
	expect(body()).toBe('<div>text</div>')
	dispose()
})

await test('children - PassThrough with all-filtered JSX-children renders empty', expect => {
	const dispose = render(
		<PassThrough>
			{true}
			{false}
			{null}
			{undefined}
		</PassThrough>,
	)
	expect(body()).toBe('<div></div>')
	dispose()
})

// --- positional merging: string/number literal runs merge anywhere ---

// `merge()` must fold runs of adjacent string/number literal siblings
// into a single string regardless of where the run sits in the
// sibling list: at the start, at the end, in the middle between two
// dynamics, and when the sequence contains multiple independent runs
// separated by dynamics.
//
// A dynamic expression (something Babel cannot constant-fold) is
// used as the boundary — `signal.read` is always an unfoldable
// function reference.

await test('children - component: merge run at the start (literals before dynamic)', expect => {
	captured = undefined
	const count = signal(1)
	const dispose = render(
		<Inspect>
			{'a'}
			{'b'}
			{'!'}
			{count.read}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(2)
	expect(captured[0]).toBe('ab!')
	expect(typeof captured[1]).toBe('function')
	dispose()
})

await test('children - component: merge run at the end (dynamic before literals)', expect => {
	captured = undefined
	const count = signal(1)
	const dispose = render(
		<Inspect>
			{count.read}
			{'a'}
			{'b'}
			{'!'}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(2)
	expect(typeof captured[0]).toBe('function')
	expect(captured[1]).toBe('ab!')
	dispose()
})

await test('children - component: merge run in the middle (dynamic, literals, dynamic)', expect => {
	captured = undefined
	const a = signal('a')
	const b = signal('b')
	const dispose = render(
		<Inspect>
			{a.read}
			{'x'}
			{'-'}
			{'y'}
			{b.read}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(3)
	expect(typeof captured[0]).toBe('function')
	expect(captured[1]).toBe('x-y')
	expect(typeof captured[2]).toBe('function')
	dispose()
})

await test('children - component: two independent literal runs around one dynamic', expect => {
	captured = undefined
	const count = signal(1)
	const dispose = render(
		<Inspect>
			{'a'}
			{'b'}
			{count.read}
			{'c'}
			{'d'}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(3)
	expect(captured[0]).toBe('ab')
	expect(typeof captured[1]).toBe('function')
	expect(captured[2]).toBe('cd')
	dispose()
})

await test('children - component: three independent literal runs around two dynamics', expect => {
	captured = undefined
	const a = signal('a')
	const b = signal('b')
	const dispose = render(
		<Inspect>
			{'1'}
			{'2'}
			{a.read}
			{'3'}
			{'4'}
			{b.read}
			{'5'}
			{'6'}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(5)
	expect(captured[0]).toBe('12')
	expect(typeof captured[1]).toBe('function')
	expect(captured[2]).toBe('34')
	expect(typeof captured[3]).toBe('function')
	expect(captured[4]).toBe('56')
	dispose()
})

await test('children - component: four mixed-size literal runs between three dynamics', expect => {
	captured = undefined
	const a = signal('A')
	const b = signal('B')
	const c = signal('C')
	const dispose = render(
		<Inspect>
			{'x'}
			{a.read}
			{'m'}
			{'n'}
			{b.read}
			{'p'}
			{'q'}
			{'r'}
			{c.read}
			{'end'}
		</Inspect>,
	)
	expect(Array.isArray(captured)).toBe(true)
	expect(captured.length).toBe(7)
	expect(captured[0]).toBe('x')
	expect(typeof captured[1]).toBe('function')
	expect(captured[2]).toBe('mn')
	expect(typeof captured[3]).toBe('function')
	expect(captured[4]).toBe('pqr')
	expect(typeof captured[5]).toBe('function')
	expect(captured[6]).toBe('end')
	dispose()
})

// Native tag: a literal run anywhere in the child sequence should
// also be merged. Leading runs are baked directly into the partial's
// HTML template by `mergeToTag`; trailing / middle runs are merged
// by the regular `merge()` pass.

await test('children - native tag: merge run at the start (literals before dynamic)', expect => {
	const count = signal('x')
	const dispose = render(
		<div>
			{'a'}
			{'b'}
			{'!'}
			{count.read}
		</div>,
	)
	expect(body()).toBe('<div>ab!x</div>')
	dispose()
})

await test('children - native tag: merge run at the end (dynamic before literals)', expect => {
	const count = signal('x')
	const dispose = render(
		<div>
			{count.read}
			{'a'}
			{'b'}
			{'!'}
		</div>,
	)
	expect(body()).toBe('<div>xab!</div>')
	dispose()
})

await test('children - native tag: merge run in the middle (dynamic, literals, dynamic)', expect => {
	const a = signal('a')
	const b = signal('b')
	const dispose = render(
		<div>
			{a.read}
			{'x'}
			{'-'}
			{'y'}
			{b.read}
		</div>,
	)
	expect(body()).toBe('<div>ax-yb</div>')
	dispose()
})

await test('children - native tag: two independent literal runs around one dynamic', expect => {
	const count = signal('x')
	const dispose = render(
		<div>
			{'a'}
			{'b'}
			{count.read}
			{'c'}
			{'d'}
		</div>,
	)
	expect(body()).toBe('<div>abxcd</div>')
	dispose()
})

await test('children - native tag: three independent literal runs around two dynamics', expect => {
	const a = signal('a')
	const b = signal('b')
	const dispose = render(
		<div>
			{'1'}
			{'2'}
			{a.read}
			{'3'}
			{'4'}
			{b.read}
			{'5'}
			{'6'}
		</div>,
	)
	expect(body()).toBe('<div>12a34b56</div>')
	dispose()
})

await test('children - native tag: four mixed-size literal runs between three dynamics', expect => {
	const a = signal('A')
	const b = signal('B')
	const c = signal('C')
	const dispose = render(
		<div>
			{'x'}
			{a.read}
			{'m'}
			{'n'}
			{b.read}
			{'p'}
			{'q'}
			{'r'}
			{c.read}
			{'end'}
		</div>,
	)
	expect(body()).toBe('<div>xAmnBpqrCend</div>')
	dispose()
})

// Boolean literals interleaved with string literals in a native tag
// should drop out and leave only the merged text.

await test('children - native tag: string/boolean/string merges to just the strings', expect => {
	const dispose = render(
		<div>
			{'a'}
			{true}
			{'b'}
			{false}
			{'c'}
		</div>,
	)
	expect(body()).toBe('<div>abc</div>')
	dispose()
})

await test('children - native tag: booleans around a dynamic drop, leaving dynamic alone', expect => {
	const label = signal('live')
	const dispose = render(
		<div>
			{true}
			{false}
			{label.read}
			{true}
			{false}
		</div>,
	)
	expect(body()).toBe('<div>live</div>')
	dispose()
})
