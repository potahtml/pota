/** @jsxImportSource pota */

// Tests for the xml tagged-template renderer: basic rendering, reactive
// interpolations, event handlers, static and dynamic attributes, prop:
// namespace, custom components via xml.define, XML() factory for
// isolated registries, built-in components (Show, For), context
// integration, mixed JSX+xml interop, SVG/MathML namespaces, template
// caching, multiple interpolations, empty template, malformed XML
// error, and uppercase tag warnings.
import { $, body, test } from '#test'

import { context, render, signal } from 'pota'
import { xml, XML } from 'pota/xml'

// --- Basic rendering ---------------------------------------------------

await test('xml - renders a simple tagged template to the DOM', expect => {
	const dispose = render(xml`<p>hello</p>`)

	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('xml - renders multiple sibling elements', expect => {
	const dispose = render(xml`<p>a</p><p>b</p>`)

	expect(body()).toBe('<p>a</p><p>b</p>')

	dispose()
})

await test('xml - interpolates string and number values', expect => {
	const name = 'world'
	const count = 42
	const dispose = render(xml`<p>${name}: ${count}</p>`)

	expect(body()).toBe('<p>world: 42</p>')

	dispose()
})

await test('xml - interpolates arrays of nested xml values', expect => {
	const items = [1, 2, 3]
	const dispose = render(
		xml`<ul>${items.map(n => xml`<li>${n}</li>`)}</ul>`,
	)

	expect(body()).toBe('<ul><li>1</li><li>2</li><li>3</li></ul>')

	dispose()
})

// --- Attributes --------------------------------------------------------

await test('xml - sets static attributes from interpolated values', expect => {
	const cls = 'highlight'
	const dispose = render(xml`<span class="${cls}">text</span>`)

	expect(body()).toBe('<span class="highlight">text</span>')

	dispose()
})

await test('xml - concatenates mixed static and dynamic attribute values', expect => {
	const color = 'red'
	const dispose = render(xml`<p class="btn-${color}">text</p>`)

	expect($('p').className).toBe('btn-red')

	dispose()
})

await test('xml - false attribute removes it; true keeps it as empty string', expect => {
	const dispose = render(
		xml`<input disabled="${true}" hidden="${false}" />`,
	)

	const el = $('input')
	expect(el.hasAttribute('disabled')).toBe(true)
	expect(el.hasAttribute('hidden')).toBe(false)

	dispose()
})

await test('xml - prop: namespace sets DOM properties instead of attributes', expect => {
	const dispose = render(xml`<input prop:value="${'hello'}" />`)

	const el = $('input')
	expect(el.value).toBe('hello')
	expect(el.getAttribute('value')).toBe(null)

	dispose()
})

// --- Reactivity --------------------------------------------------------

await test('xml - reactive signal child updates the DOM', expect => {
	const count = signal(0)
	const dispose = render(xml`<p>${count.read}</p>`)

	expect(body()).toBe('<p>0</p>')

	count.write(5)

	expect(body()).toBe('<p>5</p>')

	dispose()
})

await test('xml - reactive attribute updates when signal changes', expect => {
	const cls = signal('a')
	const dispose = render(xml`<p class="${cls.read}">text</p>`)

	const el = $('p')
	expect(el.className).toBe('a')

	cls.write('b')
	expect(el.className).toBe('b')

	dispose()
})

// --- Events ------------------------------------------------------------

await test('xml - on:event attaches a handler', expect => {
	const seen = []
	const dispose = render(
		xml`<button on:click="${() => seen.push('click')}">go</button>`,
	)

	$('button').click()
	expect(seen).toEqual(['click'])

	dispose()
})

// --- Custom components via xml.define ----------------------------------

await test('xml - xml.define registers a component by tag name', expect => {
	const myXml = XML()

	function Bold(props) {
		return myXml`<b>${props.children}</b>`
	}

	myXml.define({ Bold })

	const dispose = render(myXml`<Bold>strong</Bold>`)

	expect(body()).toBe('<b>strong</b>')

	dispose()
})

await test('xml - custom component receives props and children', expect => {
	const myXml = XML()

	function Card(props) {
		return myXml`<div class="${props.kind}">${props.children}</div>`
	}

	myXml.define({ Card })

	const dispose = render(
		myXml`<Card kind="info"><p>content</p></Card>`,
	)

	expect(body()).toBe('<div class="info"><p>content</p></div>')

	dispose()
})

await test('xml - xml.define supports nested custom components', expect => {
	const myXml = XML()

	function Inner(props) {
		return myXml`<em>${props.children}</em>`
	}

	function Outer(props) {
		return myXml`<div>-${props.children}-</div>`
	}

	myXml.define({ Inner, Outer })

	const dispose = render(myXml`<Outer><Inner>hi</Inner></Outer>`)

	expect(body()).toBe('<div>-<em>hi</em>-</div>')

	dispose()
})

// --- XML() factory isolation -------------------------------------------

await test('XML - each factory instance has its own isolated component registry', expect => {
	const a = XML()
	const b = XML()

	function InA(props) {
		return a`<s>${props.children}</s>`
	}

	a.define({ InA })

	// a knows about InA
	const disposeA = render(a`<InA>text</InA>`)
	expect(body()).toBe('<s>text</s>')
	disposeA()

	// b does not know about InA: renders it as an unknown element, not <s>
	const disposeB = render(b`<InA>text</InA>`)
	expect(body()).not.toBe('<s>text</s>')
	disposeB()
})

await test('XML - define on one instance does not pollute another', expect => {
	const a = XML()
	const b = XML()

	function Widget(props) {
		return a`<em>${props.children}</em>`
	}

	a.define({ Widget })

	// b's registry has no Widget, only a does
	expect('Widget' in b.components).toBe(false)
	expect('Widget' in a.components).toBe(true)
})


// --- Built-in Show component -------------------------------------------

await test('xml - built-in Show renders children when condition is truthy', expect => {
	const dispose = render(
		xml`<Show when="${true}"><p>visible</p></Show>`,
	)

	expect(body()).toBe('<p>visible</p>')

	dispose()
})

await test('xml - built-in Show hides children when condition is false', expect => {
	const show = signal(false)
	const dispose = render(
		xml`<Show when="${show.read}"><p>hidden</p></Show>`,
	)

	expect(body()).toBe('')

	show.write(true)
	expect(body()).toBe('<p>hidden</p>')

	dispose()
})

// --- Context -----------------------------------------------------------

await test('xml - context.Provider works inside xml templates', expect => {
	const myXml = XML()

	const Theme = context('light')

	function Display() {
		return myXml`<p>${Theme()}</p>`
	}

	myXml.define({ Provider: Theme.Provider, Display })

	const dispose = render(
		myXml`<Provider value="dark"><Display /></Provider>`,
	)

	expect(body()).toBe('<p>dark</p>')

	dispose()
})

// --- Mixed JSX and xml -------------------------------------------------

await test('xml - xml output can be used as JSX children', expect => {
	const frag = xml`<b>bold</b>`

	const dispose = render(<p>{frag}</p>)

	expect(body()).toBe('<p><b>bold</b></p>')

	dispose()
})

await test('xml - JSX elements can be interpolated into xml templates', expect => {
	const el = <em>italic</em>
	const dispose = render(xml`<p>${el}</p>`)

	expect(body()).toBe('<p><em>italic</em></p>')

	dispose()
})

// --- template caching --------------------------------------------------------

await test('xml - caches parsed templates for the same tagged template', expect => {
	function make(value) {
		return xml`<p>${value}</p>`
	}

	const a = make('first')
	const b = make('second')

	const disposeA = render(a)
	expect(body()).toBe('<p>first</p>')
	disposeA()

	const disposeB = render(b)
	expect(body()).toBe('<p>second</p>')
	disposeB()
})

// --- multiple interpolations in one attribute --------------------------------

await test('xml - multiple interpolations in a single attribute value', expect => {
	const a = 'hello'
	const b = 'world'
	const dispose = render(xml`<p class="${a}-${b}">text</p>`)

	expect($('p').className).toBe('hello-world')

	dispose()
})

// --- reactive multiple interpolations in attribute ---------------------------

await test('xml - reactive interpolation in attribute updates on signal change', expect => {
	const prefix = signal('btn')
	const suffix = signal('primary')
	const dispose = render(
		xml`<p class="${prefix.read}-${suffix.read}">text</p>`,
	)

	expect($('p').className).toBe('btn-primary')

	prefix.write('link')
	expect($('p').className).toBe('link-primary')

	suffix.write('danger')
	expect($('p').className).toBe('link-danger')

	dispose()
})

// --- partial interpolation across attribute types ---------------------------

await test('xml - partial interpolation in id attribute concatenates to a single string', expect => {
	const a = 'user'
	const b = 42
	const dispose = render(xml`<p id="${a}-${b}">text</p>`)

	expect($('p').getAttribute('id')).toBe('user-42')

	dispose()
})

await test('xml - partial interpolation with no static text between values', expect => {
	const a = 'foo'
	const b = 'bar'
	const dispose = render(xml`<p id="${a}${b}">text</p>`)

	expect($('p').getAttribute('id')).toBe('foobar')

	dispose()
})

await test('xml - partial interpolation with three or more segments', expect => {
	const a = 'one'
	const b = 'two'
	const c = 'three'
	const dispose = render(xml`<p id="${a}-${b}-${c}">text</p>`)

	expect($('p').getAttribute('id')).toBe('one-two-three')

	dispose()
})

await test('xml - partial interpolation in data-* attribute concatenates to a single string', expect => {
	const id = 'card'
	const n = 7
	const dispose = render(
		xml`<p data-key="${id}-${n}">text</p>`,
	)

	expect($('p').getAttribute('data-key')).toBe('card-7')

	dispose()
})

await test('xml - reactive partial interpolation in id attribute updates on signal change', expect => {
	const prefix = signal('user')
	const suffix = signal('1')
	const dispose = render(
		xml`<p id="${prefix.read}-${suffix.read}">text</p>`,
	)

	expect($('p').getAttribute('id')).toBe('user-1')

	prefix.write('admin')
	expect($('p').getAttribute('id')).toBe('admin-1')

	suffix.write('2')
	expect($('p').getAttribute('id')).toBe('admin-2')

	dispose()
})

await test('xml - partial interpolation in href attribute concatenates to a single string', expect => {
	const base = 'https://example.com'
	const path = 'page'
	const dispose = render(
		xml`<a href="${base}/${path}">link</a>`,
	)

	expect($('a').getAttribute('href')).toBe('https://example.com/page')

	dispose()
})

await test('xml - partial interpolation with numeric segments', expect => {
	const x = 10
	const y = 20
	const dispose = render(xml`<p id="pos-${x}x${y}">text</p>`)

	expect($('p').getAttribute('id')).toBe('pos-10x20')

	dispose()
})

await test('xml - partial interpolation in title attribute is a string, not an array', expect => {
	const a = 'hello'
	const b = 'world'
	const dispose = render(xml`<p title="${a} ${b}">text</p>`)

	// title must be a single concatenated string, not array.toString'd
	// (which would yield "hello,world" or "hello, ,world")
	expect($('p').getAttribute('title')).toBe('hello world')

	dispose()
})

// --- nested xml inside xml components ----------------------------------------

await test('xml - nested xml fragments inside custom components', expect => {
	const myXml = XML()

	function List(props) {
		return myXml`<ul>${props.children}</ul>`
	}

	myXml.define({ List })

	const items = [1, 2, 3]
	const dispose = render(
		myXml`<List>${items.map(n => myXml`<li>${n}</li>`)}</List>`,
	)

	expect(body()).toBe('<ul><li>1</li><li>2</li><li>3</li></ul>')

	dispose()
})

// --- xml empty template ------------------------------------------------------

await test('xml - empty template renders nothing', expect => {
	const dispose = render(xml``)
	expect(body()).toBe('')
	dispose()
})

// --- xml with Show fallback --------------------------------------------------

await test('xml - built-in Show with fallback renders fallback when false', expect => {
	const dispose = render(
		xml`<Show when="${false}"><p>hidden</p></Show>`,
	)
	expect(body()).toBe('')
	dispose()
})

// --- xml with store ----------------------------------------------------------

await test('xml - reactive store values update in xml templates', expect => {
	const count = signal(0)
	const dispose = render(xml`<p>count: ${count.read}</p>`)

	expect(body()).toBe('<p>count: 0</p>')

	count.write(5)
	expect(body()).toBe('<p>count: 5</p>')

	dispose()
})

// --- xml with For component --------------------------------------------------

await test('xml - built-in For component iterates reactive lists', expect => {
	const items = signal([1, 2, 3])
	const dispose = render(
		xml`<For each="${items.read}">${item =>
			xml`<span>${item}</span>`}</For>`,
	)

	expect(body()).toInclude('<span>1</span>')
	expect(body()).toInclude('<span>2</span>')
	expect(body()).toInclude('<span>3</span>')

	items.write([4, 5])
	expect(body()).toInclude('<span>4</span>')
	expect(body()).toInclude('<span>5</span>')
	expect(body()).not.toInclude('<span>3</span>')

	dispose()
})

// --- xml SVG namespace -------------------------------------------------------

await test('xml - SVG elements render with correct namespace', expect => {
	const dispose = render(
		xml`<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>`,
	)

	const svg = $('svg')
	expect(svg).not.toBe(null)
	expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')

	const circle = $('circle')
	expect(circle).not.toBe(null)
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

// --- xml MathML namespace ----------------------------------------------------

await test('xml - MathML elements render with correct namespace', expect => {
	const dispose = render(xml`<math><mrow><mi>x</mi></mrow></math>`)

	const math = $('math')
	expect(math).not.toBe(null)
	expect(math.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

	dispose()
})

// --- xml SVG partial without wrapping svg tag --------------------------------

await test('xml - SVG child elements inside a JSX svg parent have correct namespace', expect => {
	const svgChild = xml`<circle cx="10" cy="10" r="5"/>`

	const dispose = render(<svg>{svgChild}</svg>)

	const circle = $('circle')
	expect(circle).not.toBe(null)
	// parsed by DOMParser as text/xml, circle should be in SVG namespace
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

// --- xml uppercase tag warning -----------------------------------------------

await test('xml - uppercase tag not in registry logs a warning', expect => {
	const myXml = XML()
	const warnings = []
	const originalWarn = console.warn
	console.warn = (...args) => warnings.push(args.join(' '))

	const dispose = render(myXml`<Unknown>test</Unknown>`)

	console.warn = originalWarn

	expect(warnings.length > 0).toBe(true)
	expect(warnings[0]).toInclude('Unknown')

	dispose()
})

// --- xml parser error on malformed input -------------------------------------

await test('xml - malformed XML renders a parsererror element', expect => {
	const myXml = XML()

	// unclosed tag is invalid XML
	const dispose = render(myXml`<p>unclosed`)

	// DOMParser returns a parsererror element for malformed xml
	expect(body()).toInclude('parsererror')

	dispose()
})

// --- xml with only whitespace ------------------------------------------

await test('xml - template with only whitespace renders empty', expect => {
	const dispose = render(xml`   `)

	expect(body().trim()).toBe('')

	dispose()
})

// --- JSX-style whitespace cleaning ------------------------------------

await test('xml - leading and trailing whitespace adjacent to tags is stripped', expect => {
	const dispose = render(xml`<p>
		hello
	</p>`)

	expect($('p').textContent).toBe('hello')

	dispose()
})

await test('xml - blank lines between sibling elements are dropped', expect => {
	const dispose = render(xml`
		<div>
			<p>a</p>
			<p>b</p>
		</div>
	`)

	const div = $('div')
	// only the two <p> children survive — no whitespace text nodes
	expect(div.children.length).toBe(2)
	expect(div.childNodes.length).toBe(2)
	expect(div.children[0].tagName).toBe('P')
	expect(div.children[1].tagName).toBe('P')

	dispose()
})

await test('xml - multi-line text in element collapses to single spaces', expect => {
	const dispose = render(xml`<p>
		hello
		world
	</p>`)

	// "hello" and "world" join with a single space, leading/trailing
	// whitespace stripped — matches JSX
	expect($('p').textContent).toBe('hello world')

	dispose()
})

await test('xml - tabs become spaces in surviving text', expect => {
	const dispose = render(xml`<p>a\tb</p>`)

	expect($('p').textContent).toBe('a b')

	dispose()
})

await test('xml - intra-line whitespace between interpolations is preserved', expect => {
	const a = 'hello'
	const b = 'world'
	const dispose = render(xml`<p>${a} ${b}</p>`)

	expect($('p').textContent).toBe('hello world')

	dispose()
})

await test('xml - whitespace between component siblings does not interfere with Switch', expect => {
	const which = signal('b')
	const dispose = render(xml`
		<Switch fallback="none">
			<Match when="${() => which.read() === 'a'}"><p>A</p></Match>
			<Match when="${() => which.read() === 'b'}"><p>B</p></Match>
		</Switch>
	`)

	// previously the whitespace text nodes between <Match> siblings
	// would survive into Switch's children and crash on `match.when`
	expect(body()).toInclude('<p>B</p>')
	expect(body()).not.toInclude('<p>A</p>')

	dispose()
})

await test('xml - top-level whitespace around a fragment is dropped', expect => {
	const dispose = render(xml`
		<p>hi</p>
	`)

	// no surrounding text nodes — body is just the <p>
	expect(body()).toBe('<p>hi</p>')

	dispose()
})

await test('xml - text adjacent to interpolation strips outer whitespace but keeps inner spaces', expect => {
	const name = 'world'
	const dispose = render(xml`<p>
		hello ${name}
	</p>`)

	expect($('p').textContent).toBe('hello world')

	dispose()
})

// --- xml whitespace matches jsx ---------------------------------------
// Stronger contract: render the same source whitespace via both xml and
// jsx into separate mounts and compare their innerHTML directly. If the
// xml whitespace algorithm drifts from the babel preset's
// `cleanJSXElementLiteralChild`, these tests catch it without us having
// to encode an "expected" string.

function xmlJsxSame(expect, xmlEl, jsxEl) {
	const xmlMount = document.createElement('div')
	const jsxMount = document.createElement('div')
	document.body.appendChild(xmlMount)
	document.body.appendChild(jsxMount)
	const dx = render(xmlEl, xmlMount)
	const dj = render(jsxEl, jsxMount)
	expect(xmlMount.innerHTML).toBe(jsxMount.innerHTML)
	dx()
	dj()
	xmlMount.remove()
	jsxMount.remove()
}

await test('xml/jsx parity - sibling elements with blank lines between them', expect => {
	xmlJsxSame(
		expect,
		xml`
			<div>
				<p>a</p>
				<p>b</p>
			</div>
		`,
		<div>
			<p>a</p>
			<p>b</p>
		</div>,
	)
})

await test('xml/jsx parity - multi-line text inside an element collapses identically', expect => {
	xmlJsxSame(
		expect,
		xml`<p>
			hello
			world
		</p>`,
		<p>
			hello
			world
		</p>,
	)
})

await test('xml/jsx parity - leading and trailing whitespace inside an element is stripped', expect => {
	xmlJsxSame(
		expect,
		xml`<p>
			hello
		</p>`,
		<p>hello</p>,
	)
})

await test('xml/jsx parity - top-level fragment with surrounding whitespace', expect => {
	xmlJsxSame(
		expect,
		xml`
			<p>hi</p>
		`,
		<p>hi</p>,
	)
})

await test('xml/jsx parity - text + interpolation on the same line', expect => {
	const name = 'world'
	xmlJsxSame(
		expect,
		xml`<p>hello ${name}</p>`,
		<p>hello {name}</p>,
	)
})

await test('xml/jsx parity - text + interpolation across multiple lines', expect => {
	const name = 'world'
	xmlJsxSame(
		expect,
		xml`<p>
			hello ${name}
		</p>`,
		<p>
			hello {name}
		</p>,
	)
})

await test('xml/jsx parity - nested elements with mixed text children', expect => {
	xmlJsxSame(
		expect,
		xml`
			<div>
				<p>start</p>
				<span>middle</span>
				<p>end</p>
			</div>
		`,
		<div>
			<p>start</p>
			<span>middle</span>
			<p>end</p>
		</div>,
	)
})

// --- xml with number-only interpolation --------------------------------

await test('xml - number interpolation renders as text', expect => {
	const dispose = render(xml`<p>${0}</p>`)
	expect(body()).toBe('<p>0</p>')
	dispose()
})

// --- reactive attribute with null removes it ---------------------------

await test('xml - reactive attribute set to null removes the attribute', expect => {
	const value = signal('first')

	const dispose = render(xml`<p id="${() => value.read()}">hi</p>`)

	expect($('p').getAttribute('id')).toBe('first')

	value.write(null)

	expect($('p').hasAttribute('id')).toBe(false)

	dispose()
})

// --- isolated XML registries don't pollute each other -----------------

await test('xml - xml.define on default instance does not affect XML() isolated instances', expect => {
	const Custom = () => xml`<div>shared</div>`
	xml.define({ 'shared-instance': Custom })

	const isolated = XML()

	// rendering with the shared xml works: the registered component
	// resolves and renders its output, not the raw <shared-instance> tag
	const d1 = render(xml`<shared-instance />`)
	expect(body()).toBe('<div>shared</div>')
	d1()

	// rendering the same tag with the isolated instance does NOT resolve
	// the component: it falls through to a raw custom element and the
	// registered component's output is absent
	const originalWarn = console.warn
	console.warn = () => {}

	const d2 = render(isolated`<shared-instance />`)

	console.warn = originalWarn

	expect(body()).not.toInclude('<div>shared</div>')

	d2()
})

// --- use:ref -----------------------------------------------------------

await test('xml - use:ref receives the element', expect => {
	/** @type {any} */
	let captured = null
	const dispose = render(
		xml`<p use:ref="${el => (captured = el)}">hi</p>`,
	)

	expect(captured).not.toBe(null)
	expect(captured.tagName).toBe('P')
	expect(captured.textContent).toBe('hi')

	dispose()
})

// --- style attribute and style:name ------------------------------------

await test('xml - static style string sets inline styles', expect => {
	const dispose = render(
		xml`<p style="color: red; background: blue;">text</p>`,
	)

	const el = $('p')
	expect(el.style.color).toBe('red')
	expect(el.style.backgroundColor).toBe('blue')

	dispose()
})

await test('xml - style:name sets a single style property reactively', expect => {
	const color = signal('red')
	const dispose = render(
		xml`<p style:color="${color.read}">text</p>`,
	)

	expect($('p').style.color).toBe('red')

	color.write('green')
	expect($('p').style.color).toBe('green')

	dispose()
})

// --- class:name --------------------------------------------------------

await test('xml - class:name toggles a single class reactively', expect => {
	const on = signal(false)
	const dispose = render(xml`<p class:active="${on.read}">x</p>`)

	expect($('p').classList.contains('active')).toBe(false)

	on.write(true)
	expect($('p').classList.contains('active')).toBe(true)

	on.write(false)
	expect($('p').classList.contains('active')).toBe(false)

	dispose()
})

// --- Comments ----------------------------------------------------------

await test('xml - preserves static comment nodes', expect => {
	const dispose = render(xml`<div><!--hello--></div>`)

	const div = $('div')
	const comment = div.firstChild
	expect(comment.nodeType).toBe(8)
	expect(comment.nodeValue).toBe('hello')

	dispose()
})

await test('xml - interpolates values into comments', expect => {
	const name = 'world'
	const dispose = render(xml`<div><!--hi ${name}--></div>`)

	const comment = $('div').firstChild
	expect(comment.nodeType).toBe(8)
	expect(comment.nodeValue).toInclude('hi world')

	dispose()
})

await test('xml - static comment in a component used twice appears in both places (distinct nodes)', expect => {
	const myXml = XML()

	function Commented() {
		return myXml`<section><!--marker--></section>`
	}

	myXml.define({ Commented })

	const dispose = render(
		myXml`<div><Commented/><Commented/></div>`,
	)

	const sections = document.body.querySelectorAll('section')
	expect(sections.length).toBe(2)

	const c0 = sections[0].firstChild
	const c1 = sections[1].firstChild
	expect(c0.nodeType).toBe(8)
	expect(c1.nodeType).toBe(8)
	expect(c0.nodeValue).toBe('marker')
	expect(c1.nodeValue).toBe('marker')
	// must be distinct nodes — a shared cached node would only appear
	// in the second placement (DOM nodes can't be in two locations)
	expect(c0 === c1).toBe(false)

	dispose()
})

await test('xml - interpolated comment in a component used twice appears in both places (distinct nodes, both reactive)', expect => {
	const myXml = XML()
	const label = signal('a')

	function Commented() {
		return myXml`<section><!--mark:${label.read}--></section>`
	}

	myXml.define({ Commented })

	const dispose = render(
		myXml`<div><Commented/><Commented/></div>`,
	)

	const sections = document.body.querySelectorAll('section')
	expect(sections.length).toBe(2)

	const c0 = sections[0].firstChild
	const c1 = sections[1].firstChild
	expect(c0.nodeType).toBe(8)
	expect(c1.nodeType).toBe(8)
	expect(c0.nodeValue).toBe('mark:a')
	expect(c1.nodeValue).toBe('mark:a')
	// distinct nodes — if the per-render builder cached a single
	// Comment instance across renders, the first placement would be
	// empty and only the second would carry the comment
	expect(c0 === c1).toBe(false)

	// both update reactively
	label.write('b')
	expect(c0.nodeValue).toBe('mark:b')
	expect(c1.nodeValue).toBe('mark:b')

	dispose()
})

// --- mixed children ----------------------------------------------------

await test('xml - mixes text, signals and elements as siblings', expect => {
	const n = signal(1)
	const el = xml`<b>bold</b>`
	const dispose = render(
		xml`<p>start ${n.read} mid ${el} end</p>`,
	)

	expect(body()).toBe('<p>start 1 mid <b>bold</b> end</p>')

	n.write(2)
	expect(body()).toBe('<p>start 2 mid <b>bold</b> end</p>')

	dispose()
})

// --- built-in Dynamic --------------------------------------------------

await test('xml - built-in Dynamic renders a string tag', expect => {
	const dispose = render(
		xml`<Dynamic component="section">inside</Dynamic>`,
	)

	expect(body()).toBe('<section>inside</section>')

	dispose()
})

await test('xml - built-in Dynamic renders a function component', expect => {
	const Card = props => xml`<section>${props.children}</section>`
	const dispose = render(
		xml`<Dynamic component="${Card}">inside</Dynamic>`,
	)

	expect(body()).toBe('<section>inside</section>')

	dispose()
})

// --- built-in Switch / Match -------------------------------------------

await test('xml - built-in Switch picks the first truthy Match', expect => {
	const which = signal('b')
	const dispose = render(
		xml`
			<Switch fallback="none">
				<Match when="${() => which.read() === 'a'}"><p>A</p></Match>
				<Match when="${() => which.read() === 'b'}"><p>B</p></Match>
			</Switch>
		`,
	)

	expect(body()).toInclude('<p>B</p>')
	expect(body()).not.toInclude('<p>A</p>')

	which.write('a')
	expect(body()).toInclude('<p>A</p>')
	expect(body()).not.toInclude('<p>B</p>')

	dispose()
})

// --- built-in Portal ---------------------------------------------------

await test('xml - built-in Portal mounts children into the target node', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		xml`<Portal mount="${mount}"><p>portaled</p></Portal>`,
	)

	expect(mount.innerHTML).toBe('<p>portaled</p>')

	dispose()
	mount.remove()
})

// --- function attribute value (non-signal) -----------------------------

await test('xml - a plain function attribute value is treated reactively', expect => {
	let n = 0
	const cls = signal('a')
	const dispose = render(
		xml`<p class="${() => {
			n++
			return cls.read()
		}}">x</p>`,
	)

	expect($('p').className).toBe('a')
	const first = n

	cls.write('b')
	expect($('p').className).toBe('b')
	expect(n > first).toBe(true)

	dispose()
})

// --- disposal isolation ------------------------------------------------

await test('xml - dispose stops reactivity and a subsequent render is independent', expect => {
	const a = signal('first')
	const disposeA = render(xml`<p>${a.read}</p>`)

	expect(body()).toBe('<p>first</p>')

	disposeA()
	expect(body()).toBe('')

	// mutating the disposed signal must not affect the (now empty) DOM
	a.write('second')
	expect(body()).toBe('')

	// a fresh render using a new signal is unaffected by the previous one
	const b = signal('x')
	const disposeB = render(xml`<p>${b.read}</p>`)

	expect(body()).toBe('<p>x</p>')

	b.write('y')
	expect(body()).toBe('<p>y</p>')

	disposeB()
})

await test('xml - removed event listeners do not fire after dispose', expect => {
	const seen = []
	const dispose = render(
		xml`<button on:click="${() => seen.push('hit')}">go</button>`,
	)

	const btn = $('button')
	btn.click()
	expect(seen).toEqual(['hit'])

	dispose()

	// after dispose the listener must not fire even if we keep the node
	btn.click()
	expect(seen).toEqual(['hit'])
})

// --- Multiple interpolations in one text node --------------------------

await test('xml - multiple interpolations inside a single text node', expect => {
	const a = 'hello'
	const b = 'world'
	const dispose = render(xml`<p>${a} and ${b}!</p>`)

	expect(body()).toBe('<p>hello and world!</p>')

	dispose()
})

// --- data-* / aria-* attributes ----------------------------------------

await test('xml - data-* and aria-* attributes are preserved', expect => {
	const dispose = render(
		xml`<p data-testid="${'card'}" aria-label="${'greeting'}">hi</p>`,
	)

	const el = $('p')
	expect(el.getAttribute('data-testid')).toBe('card')
	expect(el.getAttribute('aria-label')).toBe('greeting')

	dispose()
})

// --- Self-closing elements ---------------------------------------------

await test('xml - self-closing void elements render without children', expect => {
	const dispose = render(xml`<div><br/><img src="${'x.png'}"/></div>`)

	const br = $('br')
	const img = $('img')
	expect(br).not.toBe(null)
	expect(img).not.toBe(null)
	expect(img.getAttribute('src')).toBe('x.png')
	expect(br.childNodes.length).toBe(0)

	dispose()
})

// --- XML entities ------------------------------------------------------

await test('xml - decodes XML entities in text', expect => {
	const dispose = render(xml`<p>a &amp; b &lt; c</p>`)

	expect($('p').textContent).toBe('a & b < c')

	dispose()
})

// --- null / undefined interpolation in text ----------------------------

await test('xml - null interpolated as child renders as empty', expect => {
	const dispose = render(xml`<p>a${null}b</p>`)

	expect($('p').textContent).toBe('ab')

	dispose()
})

await test('xml - undefined interpolated as child renders as empty', expect => {
	const dispose = render(xml`<p>a${undefined}b</p>`)

	expect($('p').textContent).toBe('ab')

	dispose()
})

// --- Boolean signal attribute ------------------------------------------

await test('xml - boolean signal attribute toggles presence', expect => {
	const on = signal(true)
	const dispose = render(
		xml`<input disabled="${on.read}" />`,
	)

	const el = $('input')
	expect(el.hasAttribute('disabled')).toBe(true)

	on.write(false)
	expect(el.hasAttribute('disabled')).toBe(false)

	on.write(true)
	expect(el.hasAttribute('disabled')).toBe(true)

	dispose()
})

// --- Deeply nested array of xml fragments ------------------------------

await test('xml - deeply nested arrays of xml fragments are flattened', expect => {
	const groups = [
		[xml`<li>a</li>`, xml`<li>b</li>`],
		[xml`<li>c</li>`],
	]
	const dispose = render(xml`<ul>${groups}</ul>`)

	expect(body()).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>')

	dispose()
})

// --- Event handler receives the DOM event ------------------------------

await test('xml - on:* handler receives the DOM event', expect => {
	/** @type {any} */
	let received = null
	const dispose = render(
		xml`<button on:click="${e => (received = e)}">go</button>`,
	)

	$('button').click()

	expect(received).not.toBe(null)
	expect(received.type).toBe('click')
	expect(received.target.tagName).toBe('BUTTON')

	dispose()
})

// --- SVG case-sensitive attribute --------------------------------------

await test('xml - SVG preserves attribute name case (viewBox)', expect => {
	const dispose = render(
		xml`<svg viewBox="0 0 10 10"><rect width="5" height="5"/></svg>`,
	)

	const svg = $('svg')
	expect(svg.getAttribute('viewBox')).toBe('0 0 10 10')
	// not present under a lowercased name
	expect(svg.hasAttribute('viewbox')).toBe(false)

	dispose()
})

// --- Same xml template rendered into two independent mounts -----------

await test('xml - the same xml call renders independently into two mounts', expect => {
	const mountA = document.createElement('div')
	const mountB = document.createElement('div')
	document.body.appendChild(mountA)
	document.body.appendChild(mountB)

	const v = signal(1)

	const disposeA = render(xml`<p>${v.read}</p>`, mountA)
	const disposeB = render(xml`<p>${v.read}</p>`, mountB)

	expect(mountA.innerHTML).toBe('<p>1</p>')
	expect(mountB.innerHTML).toBe('<p>1</p>')

	v.write(2)
	expect(mountA.innerHTML).toBe('<p>2</p>')
	expect(mountB.innerHTML).toBe('<p>2</p>')

	disposeA()
	disposeB()
	mountA.remove()
	mountB.remove()
})

// --- Function child (non-signal) ---------------------------------------

await test('xml - plain function as a child is treated reactively', expect => {
	const n = signal(0)
	const dispose = render(
		xml`<p>${() => `n=${n.read()}`}</p>`,
	)

	expect(body()).toBe('<p>n=0</p>')

	n.write(3)
	expect(body()).toBe('<p>n=3</p>')

	dispose()
})

// --- Component as interpolation target ---------------------------------

await test('xml - a function component can be resolved via Dynamic with interpolation', expect => {
	const Badge = props => xml`<b>${props.children}</b>`

	const dispose = render(
		xml`<Dynamic component="${Badge}">hi</Dynamic>`,
	)

	expect(body()).toBe('<b>hi</b>')

	dispose()
})
