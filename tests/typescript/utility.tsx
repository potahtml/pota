/** @jsxImportSource pota */

import {
	Component,
	Fragment,
	Pota,
	getValue,
	insert,
	propsPlugin,
	propsPluginNS,
	ready,
	readyAsync,
	render,
	setAttribute,
	setClass,
	setClassList,
	setProperty,
	setStyle,
	signal,
	toHTML,
} from 'pota'
import { For, Match, Show, Switch } from 'pota/components'

// ============================================
// Reused helpers for this file
// ============================================

const Card: ParentComponent<{ title: string }> = ({
	title,
	children,
}) => {
	return (
		<section class="cards">
			<h2>{title}</h2>
			{children}
		</section>
	)
}

class MyComponent extends Pota {
	props = { some: 'lala' }
	render(props) {
		return <main>{props.some}</main>
	}
}

const [val] = signal(0)

// ============================================
// Render / insert / toHTML
// ============================================

// render to DOM — children is typed as JSX.Element (wide union)
const disposer: () => void = render(<div>hello</div>, document.body)
render(() => <div>{val()}</div>, document.body)

// render accepts various JSX.Element shapes
render('plain text', document.body)
render(42, document.body)
render(null, document.body)
render(undefined, document.body)
render([<div />, <span />, 'text'], document.body)
render(Promise.resolve(<div />), document.body)

// render with options
render(<div />, document.body, { clear: true })
render(<div />, document.body, { clear: false, relative: true })

// render to null parent (defaults to document.body)
render(<div />)

// @ts-expect-error render's parent must be Element | null, not a string selector
const renderBad = render(<div />, '#root')

// insert into existing node
insert(<span>inserted</span>, document.body)

// insert accepts same JSX.Element shapes as render
insert('text', document.body)
insert([<div />, <span />], document.body)

// toHTML — returns JSX.Element
const html: JSX.Element = toHTML(<div>content</div>)
// toHTML accepts same JSX.Element shapes
const htmlStr: JSX.Element = toHTML('plain text')
const htmlArr: JSX.Element = toHTML([<div />, <span />])

// ============================================
// Component() runtime function
// ============================================
// Two overloads:
//   Component(value)            → factory typed via ComponentProps<T>
//   Component(value, props)     → P inferred freely from props,
//                                 preserves generic components' inner T

// --- factory form (one argument) ---

// factory for a user function component
const cardFactory = Component(Card)
const cardFromFactory = cardFactory({ title: 'hi', children: <div /> })
// factory can be invoked repeatedly with different props
const cardAgain = cardFactory({ title: 'second', children: <span /> })

// factory for a string tag
const divFactory = Component('div')
const divFromFactory = divFactory({ class: 'foo' })

// factory for a different tag
const spanFactory = Component('span')
const spanFromFactory = spanFactory({ id: 'x' })

// factory for an intrinsic element with element-specific props
const anchorFactory = Component('a')
const anchorFromFactory = anchorFactory({
	href: 'https://example.com',
	target: '_blank',
})

// factory for a class component
const myComponentFactory = Component(MyComponent)

// factory for Fragment — returns a factory
const fragFactory = Component(Fragment)

// factory with no props called — valid
const emptyInvoke: JSX.Element = cardFactory()

// --- fixed-props form (two arguments) ---

// fixed-props with a user component
const fixedCard = Component(Card, {
	title: 'fixed',
	children: <span>child</span>,
})
// invoking without overrides
const fixedCardNoOverride: JSX.Element = fixedCard()
// invoking with overrides merges props
const fixedCardOverride: JSX.Element = fixedCard({
	title: 'override',
})

// fixed-props with a string tag
const fixedDiv = Component('div', { class: 'fixed', id: 'x' })
const fixedDivResult: JSX.Element = fixedDiv()

// fixed-props with class component
const fixedMyComp = Component(MyComponent, { some: 'fixed-value' })

// fixed-props with generic For — T preservation
const fixedFor = Component(For, {
	each: [1, 2, 3],
	children: (item: number, index: number) => <li>{item}</li>,
})

// fixed-props with generic Show — T preservation
const [sig] = signal(42)
const fixedShow = Component(Show, {
	when: sig,
	children: (value: SignalAccessor<number>) => <span>{value()}</span>,
})

// fixed-props with generic Match
const fixedMatch = Component(Match, {
	when: sig,
	children: (value: SignalAccessor<number>) => <span>{value()}</span>,
})

// --- Fragment handling (runtime returns children directly) ---

// Fragment with children prop — returns a factory at type level,
// returns the children directly at runtime (Component's Fragment
// special-case branch)
const fragWithChildren = Component(Fragment, {
	children: <div>inside</div>,
})

// Fragment with multiple children as array
const fragMulti = Component(Fragment, {
	children: [<div>one</div>, <span>two</span>],
})

// Fragment with text children
const fragText = Component(Fragment, { children: 'just text' })

// Fragment with no children
const fragEmpty = Component(Fragment, { children: undefined })

// --- DOM Element as value ---

// Native DOM element passed as component — pota uses it as a template
const divEl = document.createElement('div')
const elementFactory = Component(divEl)
const elementFromFactory: JSX.Element = elementFactory({ class: 'cloned' })

// SVG element
const svgEl = document.createElementNS(
	'http://www.w3.org/2000/svg',
	'svg',
) as SVGSVGElement
const svgFactory = Component(svgEl)

// --- Arbitrary non-component values (rendered as-is) ---

// String as value — produces a factory that renders it
const stringFactory = Component('just a string' as unknown as Element)

// --- Component as input to another Component (composition) ---

// Wrap a component factory
const wrappedCard = Component(Card, { title: 'wrapped' })
// The wrapped factory itself can be passed back to Component
const reWrapped = Component(wrappedCard)

// --- Generic-preservation checks ---

// For<number> preserves T when passed via Component — item is number,
// not unknown
const preserveFor = Component(For, {
	each: [1, 2, 3],
	children: (item, index) => {
		const n: number = item
		const i: number = index
		return <li>{n}</li>
	},
})

// For<string> also preserves
const preserveForStr = Component(For, {
	each: ['a', 'b'],
	children: item => {
		const s: string = item
		return <li>{s}</li>
	},
})

// --- Children via Fragment shorthand ---

// Building a multi-child result via Fragment manually
const manualFragment = Component(Fragment, {
	children: [
		Component('div', { class: 'a' })(),
		Component('span', { class: 'b' })(),
	],
})

// --- Factory return reusability ---

// Factory returned by Component(Tag) is a stable function — can be
// saved and reused like a namespaced helper
const namedDiv = Component('div')
const header = namedDiv({ class: 'header' })
const footer = namedDiv({ class: 'footer' })

// --- Partial props on invoking a fixed-props factory ---

// When pre-fixed, invoke with overrides only (optional)
const partialOverride = Component('input', {
	type: 'text',
	disabled: true,
})
// Overrides merged with fixed props
const p1: JSX.Element = partialOverride({ disabled: false })
// No overrides
const p2: JSX.Element = partialOverride()
const p3: JSX.Element = partialOverride(undefined)

// --- Component accepts any object (no excess-prop check at 2-arg form) ---
// This is by design — the 2-arg form's P is free. Generic-preserving
// components like For depend on this.

// Extra props on Card are accepted (not ideal but intentional)
const extraPropsCard = Component(Card, {
	title: 'hi',
	children: <div />,
	extraProp: 'allowed at Component level',
})

// --- String-tag overload: props ARE type-checked ---
// The intrinsic-tag overload is more specific than the free-P one,
// so excess props on native elements get rejected.

// valid intrinsic-element props
const okDiv = Component('div', { class: 'a', id: 'x' })
const okAnchor = Component('a', { href: '/x', target: '_blank' })
const okInput = Component('input', { type: 'text', disabled: true })

// @ts-expect-error nonsense prop not on <div>
const badDiv1 = Component('div', { nonsense: true })
// @ts-expect-error href is on <a>, not <div>
const badDiv2 = Component('div', { href: '/x' })
// @ts-expect-error wrong type for tabindex
const badDiv3 = Component('div', { tabindex: {} })

// ============================================
// ready / readyAsync — scheduler lifecycle
// ============================================

// ready(cb) — fires after the current render flushes
ready(() => {
	// run once everything is settled
})

// readyAsync — async variant, accepts promise-returning callback
readyAsync(() => Promise.resolve())
// also callable with plain void fn
readyAsync(() => {})

// ============================================
// getValue — unwrap accessor or pass through
// ============================================
// getValue<T>(value: Accessor<T>): T — recursively unwraps if it's
// a function, otherwise returns the value as-is.

// with a primitive
const gvPrim: number = getValue(42)

// with a plain function
const gvFn: number = getValue(() => 42)

// with a signal accessor
const [sigVal] = signal('hello')
const gvSig: string = getValue(sigVal)

// with a nested function (getValue unwraps recursively at runtime)
const gvNested = getValue(() => () => 42)

// with boolean and object
const gvBool: boolean = getValue(true)
const gvObj: { a: number } = getValue({ a: 1 })

// ============================================
// setAttribute / setProperty / setStyle / setClass / setClassList
// ============================================
// Low-level DOM writers exported from pota.

const node = document.createElement('div')

// setAttribute(node, name, Accessor<string | boolean>)
setAttribute(node, 'data-x', 'value')
setAttribute(node, 'data-y', () => 'lazy')
setAttribute(node, 'hidden', true)

// setProperty(node, name, unknown)
setProperty(node, 'textContent', 'text')
setProperty(node, 'innerText', 'inner')

// setStyle(node, name, value) — pota re-exports setElementStyle
// as setStyle, which writes a single named style.
setStyle(node, 'color', 'red')
setStyle(node, 'background', () => 'blue')

// setClass(node, name, value) — pota re-exports setElementClass
// as setClass, which toggles a single named class.
setClass(node, 'active', true)
setClass(node, 'hidden', () => false)

// setClassList(node, value, prev?) — diff-based classList writer
setClassList(node, { active: true })
setClassList(node, { active: true }, { hidden: true })

// setClassList accepts string value
setClassList(node, 'active hidden')

// setClassList accepts array value
setClassList(node, ['active', 'hidden'])

// setClassList with empty object
setClassList(node, {})

// setClassList with prev arg used
setClassList(node, { a: true }, { b: false })

// ============================================
// propsPlugin / propsPluginNS
// ============================================
// Registers a prop-handler plugin so that `use:name` / `on:name`
// (etc.) props get dispatched to it.

// propsPlugin(name, plugin, onMicrotask?)
propsPlugin<boolean>('use:my-flag', (node, value) => {
	// node is JSX.DOMElement, value is typed from the generic
	const v: boolean = value
})

propsPlugin<string>('use:my-string', (node, value) => {
	const v: string = value
})

// propsPluginNS(ns, plugin, onMicrotask?)
propsPluginNS('my', (node, localName, value, ns) => {
	// plugin for `my:*` namespace — localName is e.g. "foo" for my:foo
})

// ============================================
// xml API (pota/xml)
// ============================================

import { xml, XML } from 'pota/xml'

// xml tagged template
const xmlResult = xml`<div>hello</div>`

// XML factory — no args, use .define() for components
const myXml = XML()
myXml.define({ Card })
const xmlWithComp = myXml`<Card title="t">child</Card>`

// ============================================
// xml with interpolation
// ============================================
// xml tagged templates accept arbitrary interpolated values.

const xmlStringInterp = xml`<div>${'hello'}</div>`
const xmlNumInterp = xml`<div>${42}</div>`
const xmlSignalInterp = xml`<div>${val}</div>`
const xmlElementInterp = xml`<div>${<span>inner</span>}</div>`
const xmlMultipleInterp = xml`<div>${'a'} and ${'b'}</div>`

// xml returns JSX.Element (a wide union — compiles as any element)
const xmlAsChild = <main>{xmlStringInterp}</main>

// ============================================
// setClassList — third-arg `prev` overload
// ============================================
// setClassList(node, value, prev?) — when `prev` is passed, classes
// present in prev but not value are removed.

setClassList(node, { a: true })
setClassList(node, { a: true }, { b: true })
setClassList(node, { a: true, b: false }, { a: false, c: true })

// signal-wrapped values
setClassList(node, { a: () => true }, { a: () => false })

// ============================================
// Component(Fragment) — Fragment is not exported from 'pota'
// ============================================
// The Fragment symbol is only exposed via `pota/jsx-runtime` for
// the JSX transform, not from the `pota` main entry. Testing
// Component(Fragment) directly from the public surface is not
// possible — skip.
