/** @jsxImportSource pota */

// Tests for the xml tagged-template renderer: basic rendering, reactive
// interpolations, event handlers, static and dynamic attributes, prop:
// namespace, custom components via xml.define, XML() factory for
// isolated registries, built-in components (Show), context integration,
// and mixed JSX+xml interop.
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
