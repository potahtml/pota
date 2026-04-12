/** @jsxImportSource pota */

// Tests for the Babel preset JSX transform: spread merging, prop
// ordering, static values, namespaced props, fragments, children
// coercion, reactive expressions, void elements, and SVG namespaces.

import { $, body, test } from '#test'
import { render, signal } from 'pota'
import 'pota/use/bind'

const style = { style: 'border:black', something: { value: 1 + 1 } }
const style2 = {}

const spread1 = (
	<div
		style="border: blue;"
		{...style}
		style="border: red;"
		prop:not-identifier={/* @static */ ' '.trim()}
	/>
)
const spread2 = <div {...style} />
const spread3 = (
	<div
		{...style}
		{...{ ...style, ...style2 }}
		style="border: orange;"
		nada:nada="test"
	/>
)
const spread4 = <div {...{ ...style, ...style2 }} />

await test('transform - spread1 renders with later explicit props winning', expect => {
	const dispose = render(spread1)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: red;"></div>',
	)

	dispose()
})

await test('transform - spread2 renders spread object props', expect => {
	const dispose = render(spread2)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: black;"></div>',
	)

	dispose()
})

await test('transform - spread3 merges nested spread expressions and explicit props', expect => {
	const dispose = render(spread3)

	expect(body()).toBe(
		'<div something="[object Object]" nada:nada="test" style="border: orange;"></div>',
	)

	dispose()
})

await test('transform - spread4 renders merged spread object values', expect => {
	const dispose = render(spread4)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: black;"></div>',
	)

	dispose()
})

// --- fragments ------------------------------------------------------------

await test('transform - empty fragment renders nothing', expect => {
	const dispose = render(<></>)

	expect(body()).toBe('')

	dispose()
})

await test('transform - fragment renders siblings without a wrapper element', expect => {
	const dispose = render(
		<>
			<p>one</p>
			<p>two</p>
			<p>three</p>
		</>,
	)

	expect(body()).toBe('<p>one</p><p>two</p><p>three</p>')

	dispose()
})

await test('transform - fragment mixing text and elements interleaves correctly', expect => {
	const dispose = render(
		<>
			before
			<span>middle</span>
			after
		</>,
	)

	expect(body()).toBe('before<span>middle</span>after')

	dispose()
})

// --- children coercion ---------------------------------------------------

await test('transform - number children are coerced to their string form', expect => {
	const dispose = render(<p>{42}</p>)

	expect(body()).toBe('<p>42</p>')

	dispose()
})

await test('transform - null and undefined children render nothing', expect => {
	const dispose = render(
		<p>
			a{null}b{undefined}c
		</p>,
	)

	expect(body()).toBe('<p>abc</p>')

	dispose()
})

await test('transform - boolean children are filtered out', expect => {
	const dispose = render(
		<p>
			a{true}b{false}c
		</p>,
	)

	// boolean literals are filtered at compile time and runtime
	// booleans are suppressed in the renderer — either way they
	// render as nothing
	expect(body()).toBe('<p>abc</p>')

	dispose()
})

await test('transform - array children are flattened and rendered in order', expect => {
	const dispose = render(<p>{[1, 2, 3].map(x => <span>{x}</span>)}</p>)

	expect(body()).toBe('<p><span>1</span><span>2</span><span>3</span></p>')

	dispose()
})

// --- conditional children ------------------------------------------------

await test('transform - && short-circuit with false renders nothing', expect => {
	const dispose = render(<div>{false && <span>hidden</span>}</div>)

	expect(body()).toBe('<div></div>')

	dispose()
})

await test('transform - && short-circuit with true renders the element', expect => {
	const dispose = render(<div>{true && <span>shown</span>}</div>)

	expect(body()).toBe('<div><span>shown</span></div>')

	dispose()
})

await test('transform - ternary picks the matching branch', expect => {
	const dispose = render(
		<div>{1 + 1 === 2 ? <span>yes</span> : <span>no</span>}</div>,
	)

	expect(body()).toBe('<div><span>yes</span></div>')

	dispose()
})

// --- reactive children ---------------------------------------------------

await test('transform - signal accessor passed as child is subscribed and updates in place', expect => {
	const count = signal(0)

	const dispose = render(<p>{count.read}</p>)

	expect(body()).toBe('<p>0</p>')

	count.write(1)
	expect(body()).toBe('<p>1</p>')

	count.write(42)
	expect(body()).toBe('<p>42</p>')

	dispose()
})

await test('transform - function child is subscribed and re-renders on signal change', expect => {
	const name = signal('Ada')

	const dispose = render(<p>hello {() => name.read()}</p>)

	expect(body()).toBe('<p>hello Ada</p>')

	name.write('Grace')
	expect(body()).toBe('<p>hello Grace</p>')

	dispose()
})

// --- attributes -----------------------------------------------------------

await test('transform - number attribute is stringified', expect => {
	const dispose = render(<input tabIndex={3} />)

	expect($('input').getAttribute('tabindex')).toBe('3')

	dispose()
})

await test('transform - boolean attribute true sets an empty string', expect => {
	const dispose = render(<input disabled={true} />)

	expect($('input').hasAttribute('disabled')).toBe(true)
	expect($('input').getAttribute('disabled')).toBe('')

	dispose()
})

await test('transform - boolean attribute false removes the attribute', expect => {
	const dispose = render(<input disabled={false} />)

	expect($('input').hasAttribute('disabled')).toBe(false)

	dispose()
})

await test('transform - null attribute is removed', expect => {
	const dispose = render(<input value={null} />)

	expect($('input').hasAttribute('value')).toBe(false)

	dispose()
})

await test('transform - undefined attribute is removed', expect => {
	const dispose = render(<input value={undefined} />)

	expect($('input').hasAttribute('value')).toBe(false)

	dispose()
})

// --- void elements -------------------------------------------------------

await test('transform - self-closing void element renders without children', expect => {
	const dispose = render(
		<>
			<br />
			<hr />
			<img />
		</>,
	)

	expect(body()).toBe('<br><hr><img>')

	dispose()
})

// --- SVG namespace -------------------------------------------------------

await test('transform - svg element is created in the correct namespace', expect => {
	const dispose = render(
		<svg>
			<circle
				cx="10"
				cy="10"
				r="5"
			/>
		</svg>,
	)

	const svg = $('svg')
	const circle = $('circle')

	expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

// --- reactive attributes -------------------------------------------------

await test('transform - signal as attribute value updates the attribute', expect => {
	const id = signal('first')

	const dispose = render(<p id={() => id.read()}>hi</p>)

	expect($('p').getAttribute('id')).toBe('first')

	id.write('second')

	expect($('p').getAttribute('id')).toBe('second')

	dispose()
})

// --- class and style -----------------------------------------------------

await test('transform - class attribute accepts string', expect => {
	const dispose = render(<div class="foo bar" />)

	expect($('div').className).toBe('foo bar')

	dispose()
})

await test('transform - style attribute accepts string', expect => {
	const dispose = render(<div style="color: red;" />)

	expect($('div').style.color).toBe('red')

	dispose()
})

// --- whitespace handling -------------------------------------------------

await test('transform - significant whitespace between inline elements is preserved', expect => {
	const dispose = render(
		<p>
			<span>a</span> <span>b</span>
		</p>,
	)

	expect(body()).toBe('<p><span>a</span> <span>b</span></p>')

	dispose()
})

// --- deeply nested JSX ---------------------------------------------------

await test('transform - deeply nested children flatten correctly', expect => {
	const dispose = render(
		<section>
			<article>
				<header>
					<h1>title</h1>
				</header>
				<p>body</p>
			</article>
		</section>,
	)

	expect(body()).toBe(
		'<section><article><header><h1>title</h1></header><p>body</p></article></section>',
	)

	dispose()
})

// --- component interop ----------------------------------------------------

await test('transform - components receive children as props.children', expect => {
	function Wrapper(props) {
		return <section data-kind="wrapper">{props.children}</section>
	}

	const dispose = render(
		<Wrapper>
			<p>inside</p>
		</Wrapper>,
	)

	expect(body()).toBe(
		'<section data-kind="wrapper"><p>inside</p></section>',
	)

	dispose()
})

await test('transform - components receive camelCase event handlers as props', expect => {
	let clicked = 0

	function Button(props) {
		return <button on:click={props.onClick}>{props.children}</button>
	}

	const dispose = render(<Button onClick={() => clicked++}>go</Button>)

	$('button').click()
	expect(clicked).toBe(1)

	dispose()
})

// --- zero as child renders as '0' ---------------------------------------

await test('transform - numeric 0 child renders as text "0"', expect => {
	const dispose = render(<p>{0}</p>)

	expect(body()).toBe('<p>0</p>')

	dispose()
})

// --- empty string child -----------------------------------------------

await test('transform - empty string child renders as empty', expect => {
	const dispose = render(<p>{''}</p>)

	expect(body()).toBe('<p></p>')

	dispose()
})

// --- JSX comments inside children --------------------------------------

await test('transform - JSX expression comments do not appear in output', expect => {
	const dispose = render(
		<p>
			a{/* this is a comment */}b
		</p>,
	)

	expect(body()).toBe('<p>ab</p>')

	dispose()
})

// --- self-closing vs explicit close --------------------------------

await test('transform - self-closing and explicit-close elements render identically', expect => {
	const d1 = render(<div />)
	expect(body()).toBe('<div></div>')
	d1()

	const d2 = render(<div></div>)
	expect(body()).toBe('<div></div>')
	d2()
})

// --- style:name namespaced style ------------------------------------

await test('transform - style:name sets a single style property', expect => {
	const dispose = render(<div style:background-color="red" />)

	expect($('div').style.backgroundColor).toBe('red')

	dispose()
})

// --- class:name namespaced class toggle -----------------------------

await test('transform - class:name toggles a single class via a boolean value', expect => {
	const dispose = render(<div class:active={true} />)

	expect($('div').classList.contains('active')).toBe(true)

	dispose()
})

// --- nested fragments flatten into parent ---------------------------

await test('transform - nested fragments flatten into the parent', expect => {
	const dispose = render(
		<div>
			<>
				<p>a</p>
				<>
					<p>b</p>
					<p>c</p>
				</>
			</>
		</div>,
	)

	expect(body()).toBe('<div><p>a</p><p>b</p><p>c</p></div>')

	dispose()
})

// --- prop: and attribute props on same element ----------------------

await test('transform - prop: and regular attribute can coexist on same element', expect => {
	const dispose = render(
		<input
			type="text"
			prop:value="via-prop"
			data-extra="via-attr"
		/>,
	)

	const input = $('input')
	expect(input.value).toBe('via-prop')
	expect(input.getAttribute('data-extra')).toBe('via-attr')

	dispose()
})

// --- spread with empty object is a no-op ----------------------------

await test('transform - spread with empty object adds no props', expect => {
	const dispose = render(<div {...{}} class="kept" />)

	expect($('div').className).toBe('kept')

	dispose()
})

// --- data-* attributes render with dash preserved ------------------

await test('transform - data-* attributes keep their kebab-case name', expect => {
	const dispose = render(<div data-user-id="42" data-role="admin" />)

	const div = $('div')
	expect(div.getAttribute('data-user-id')).toBe('42')
	expect(div.getAttribute('data-role')).toBe('admin')

	dispose()
})

// --- aria-* attributes --------------------------------------------

await test('transform - aria-* attributes render with dash preserved', expect => {
	const dispose = render(<div aria-label="info" aria-hidden="true" />)

	const div = $('div')
	expect(div.getAttribute('aria-label')).toBe('info')
	expect(div.getAttribute('aria-hidden')).toBe('true')

	dispose()
})
