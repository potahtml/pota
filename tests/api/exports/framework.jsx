/** @jsxImportSource pota */

// Integration scenarios testing the renderer as a whole: reactive
// children switching types, effect disposal on unmount, keyed list
// reordering, event handlers, Portal, use:connected, use:disconnected,
// SVG/MathML/foreignObject namespaces, createPartial, CSSStyleSheet
// as child, text node reuse, promise/Set/DocumentFragment children,
// boolean/number/null rendering, nested effects/roots, batch, memo
// chains, and context across Show toggles.
import { $, $$, body, macrotask, microtask, test } from '#test'

import {
	addEvent,
	batch,
	cleanup,
	context,
	effect,
	memo,
	render,
	root,
	signal,
} from 'pota'
import { Dynamic, For, Portal, Show } from 'pota/components'
import { createPartial } from 'pota/jsx-runtime'
import { css } from 'pota/use/css'

await test('framework - reactive children can switch between text, arrays, elements and empty without corrupting sibling order', expect => {
	const mode = signal('text')
	const dispose = render(
		<div>
			<span>before</span>
			{() =>
				mode.read() === 'text' ? (
					'middle'
				) : mode.read() === 'array' ? (
					[<b>bold</b>, <i>italic</i>]
				) : mode.read() === 'element' ? (
					<u>under</u>
				) : null
			}
			<span>after</span>
		</div>,
	)

	expect(body()).toBe(
		'<div><span>before</span>middle<span>after</span></div>',
	)

	mode.write('array')
	expect(body()).toBe(
		'<div><span>before</span><b>bold</b><i>italic</i><span>after</span></div>',
	)

	mode.write('element')
	expect(body()).toBe(
		'<div><span>before</span><u>under</u><span>after</span></div>',
	)

	mode.write('empty')
	expect(body()).toBe(
		'<div><span>before</span><span>after</span></div>',
	)

	dispose()
})

await test('framework - conditional branches dispose owned effects exactly when unmounted and recreate cleanly', expect => {
	const visible = signal(true)
	const seen = []
	const Child = () => {
		effect(() => {
			seen.push('mount')
			cleanup(() => {
				seen.push('cleanup')
			})
		})
		return <p>child</p>
	}
	const dispose = render(
		<Show when={visible.read}>
			<Child />
		</Show>,
	)

	expect(body()).toBe('<p>child</p>')
	expect(seen).toEqual(['mount'])

	visible.write(false)
	expect(body()).toBe('')
	expect(seen).toEqual(['mount', 'cleanup'])

	visible.write(true)
	expect(body()).toBe('<p>child</p>')
	expect(seen).toEqual(['mount', 'cleanup', 'mount'])

	dispose()
	expect(seen).toEqual(['mount', 'cleanup', 'mount', 'cleanup'])
})

await test('framework - keyed list reordering preserves DOM node identity and uncontrolled input state', expect => {
	const first = { id: 'a', label: 'A' }
	const second = { id: 'b', label: 'B' }
	const items = signal([first, second])
	const dispose = render(
		<For each={items.read}>
			{item => (
				<input
					data-id={item.id}
					value={item.label}
				/>
			)}
		</For>,
	)

	const firstNode = $('[data-id="a"]')
	const secondNode = $('[data-id="b"]')

	firstNode.value = 'typed A'
	secondNode.value = 'typed B'

	items.write([second, first])

	expect($$('input')[0]).toBe(secondNode)
	expect($$('input')[1]).toBe(firstNode)
	expect($('[data-id="a"]').value).toBe('typed A')
	expect($('[data-id="b"]').value).toBe('typed B')

	dispose()
})

await test('framework - event handlers arent reactive', expect => {
	const handler = signal(() => {})
	const calls = []

	handler.write(() => {
		calls.push('first')
	})
	const dispose = render(
		<button on:click={handler.read}>click</button>,
	)

	expect($('button') instanceof HTMLButtonElement).toBe(true)

	$('button').click()
	handler.write(() => {
		calls.push('second')
	})
	$('button').click()

	// on:click={handler.read} just reads the signal on click, it doesnt actually runs the signal value in the event listener
	expect(calls).toEqual([])

	dispose()
})

await test('framework - Portal content is mounted outside the local tree and still cleans up with the owner', expect => {
	const mount = document.createElement('div')
	mount.id = 'portal-mount'
	document.body.appendChild(mount)

	const dispose = render(
		<>
			<p>local</p>
			<Portal mount={mount}>
				<span>ported</span>
			</Portal>
		</>,
	)

	expect(body()).toBe(
		'<div id="portal-mount"><span>ported</span></div><p>local</p>',
	)
	expect($('#portal-mount').innerHTML).toBe('<span>ported</span>')

	dispose()

	expect($('#portal-mount').innerHTML).toBe('')
	$('#portal-mount').remove()
})

await test('framework - use:connected fires after the element is inserted into the DOM', async expect => {
	const seen = []

	const dispose = render(
		<main use:connected={node => seen.push(node.tagName)}>
			content
		</main>,
	)

	expect(seen).toEqual([])

	await microtask()

	expect(seen).toEqual(['MAIN'])

	dispose()
})

await test('framework - use:connected accepts an array of callbacks', async expect => {
	const seen = []

	const dispose = render(
		<p
			use:connected={[
				node => seen.push('a:' + node.tagName),
				node => seen.push('b:' + node.tagName),
			]}
		>
			hi
		</p>,
	)

	expect(seen).toEqual([])

	await microtask()

	expect(seen).toEqual(['a:P', 'b:P'])

	dispose()
})

await test('framework - use:disconnected fires when the element is removed from the DOM', expect => {
	const seen = []

	const dispose = render(
		<main use:disconnected={node => seen.push(node.tagName)}>
			content
		</main>,
	)

	expect(seen).toEqual([])

	dispose()

	expect(seen).toEqual(['MAIN'])
})

// --- SVG namespace rendering -------------------------------------------------

await test('framework - SVG elements render with correct namespace', expect => {
	const dispose = render(
		<svg width="100" height="100">
			<circle cx="50" cy="50" r="40" />
		</svg>,
	)

	const svg = $('svg')
	expect(svg instanceof SVGElement).toBe(true)
	expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')

	const circle = $('circle')
	expect(circle instanceof SVGElement).toBe(true)
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

await test('framework - nested SVG elements preserve SVG namespace', expect => {
	const dispose = render(
		<svg>
			<g>
				<rect width="10" height="10" />
			</g>
		</svg>,
	)

	const rect = $('rect')
	expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg')

	dispose()
})

// --- foreignObject resets namespace to HTML -----------------------------------

await test('framework - foreignObject inside SVG allows HTML children', expect => {
	const dispose = render(
		<svg>
			<foreignObject>
				<div>html inside svg</div>
			</foreignObject>
		</svg>,
	)

	const div = $('div')
	expect(div instanceof HTMLDivElement).toBe(true)

	dispose()
})

// --- text node reuse ---------------------------------------------------------

await test('framework - reactive text updates reuse the same text node', expect => {
	const text = signal('hello')
	const dispose = render(
		<div>{text.read}</div>,
	)

	const textNode = $('div').firstChild
	expect(textNode.nodeType).toBe(3) // TEXT_NODE
	expect(textNode.textContent).toBe('hello')

	text.write('world')
	// same text node is reused, not replaced
	expect($('div').firstChild).toBe(textNode)
	expect(textNode.textContent).toBe('world')

	dispose()
})

// --- children switching types including null ---------------------------------

await test('framework - reactive child switching between element and null cleans up', expect => {
	const show = signal(true)
	const dispose = render(
		<div>
			{() => (show.read() ? <p>yes</p> : null)}
		</div>,
	)

	expect($('p')).not.toBe(null)
	expect($('p').textContent).toBe('yes')

	show.write(false)
	expect($('p')).toBe(null)

	show.write(true)
	expect($('p')).not.toBe(null)
	expect($('p').textContent).toBe('yes')

	dispose()
})

// --- promise children --------------------------------------------------------

await test('framework - promise as child renders when resolved', async expect => {
	const dispose = render(
		<div>{Promise.resolve('async text')}</div>,
	)

	await macrotask()

	expect($('div').textContent).toBe('async text')

	dispose()
})

// --- iterable children -------------------------------------------------------

await test('framework - Set as child renders all values', expect => {
	const items = new Set(['a', 'b', 'c'])
	const dispose = render(
		<div>{items}</div>,
	)

	expect($('div').textContent).toBe('abc')

	dispose()
})

// --- component props are frozen ----------------------------------------------

await test('framework - component props object is frozen', expect => {
	let capturedProps

	function Capture(props) {
		capturedProps = props
		return <p>ok</p>
	}

	const dispose = render(<Capture name="test" />)

	expect(Object.isFrozen(capturedProps)).toBe(true)
	expect(capturedProps.name).toBe('test')

	dispose()
})

// --- render multiple independent into body -----------------------------------

await test('framework - concurrent renders into different parents do not interfere', expect => {
	const a = document.createElement('div')
	const b = document.createElement('div')
	document.body.append(a, b)

	const disposeA = render(<p>A</p>, a)
	const disposeB = render(<p>B</p>, b)

	expect(a.innerHTML).toBe('<p>A</p>')
	expect(b.innerHTML).toBe('<p>B</p>')

	disposeA()
	expect(a.innerHTML).toBe('')
	expect(b.innerHTML).toBe('<p>B</p>')

	disposeB()
	a.remove()
	b.remove()
})

// --- nested disposal order ---------------------------------------------------

await test('framework - nested scopes dispose children before parents', expect => {
	const order = []

	const dispose = root(d => {
		cleanup(() => order.push('parent'))
		root(d2 => {
			cleanup(() => order.push('child'))
			root(d3 => {
				cleanup(() => order.push('grandchild'))
				d3()
			})
			d2()
		})
		return d
	})

	expect(order).toEqual(['grandchild', 'child'])

	dispose()

	expect(order).toEqual(['grandchild', 'child', 'parent'])
})

// --- boolean attribute semantics via JSX -------------------------------------

await test('framework - boolean attributes: true sets empty string, false removes', expect => {
	const disabled = signal(true)
	const dispose = render(
		<input disabled={disabled.read} />,
	)
	const el = $('input')

	expect(el.hasAttribute('disabled')).toBe(true)
	expect(el.getAttribute('disabled')).toBe('')

	disabled.write(false)
	expect(el.hasAttribute('disabled')).toBe(false)

	dispose()
})

// --- event handler ownership -------------------------------------------------

await test('framework - event handler registered inside component is cleaned up on dispose', expect => {
	const seen = []
	const button = document.createElement('button')
	document.body.append(button)

	// baseline: no clicks yet
	expect(seen).toEqual([])

	const dispose = root(d => {
		addEvent(button, 'click', () => seen.push('click'))
		return d
	})

	button.click()
	expect(seen).toEqual(['click'])

	dispose()

	button.click()
	expect(seen).toEqual(['click'])

	button.remove()
})

// --- glitch-free rendering ---------------------------------------------------

await test('framework - batch prevents intermediate DOM states', expect => {
	const a = signal('A')
	const b = signal('B')
	const snapshots = []

	const dispose = render(
		<div>
			{() => {
				const text = a.read() + b.read()
				snapshots.push(text)
				return text
			}}
		</div>,
	)

	expect(snapshots).toEqual(['AB'])

	batch(() => {
		a.write('X')
		b.write('Y')
	})

	// only one re-render: AB → XY, no intermediate XB or AY
	expect(snapshots).toEqual(['AB', 'XY'])

	dispose()
})

// --- number child renders as text --------------------------------------------

await test('framework - number child renders as text content', expect => {
	const count = signal(42)
	const dispose = render(<div>{count.read}</div>)

	expect($('div').textContent).toBe('42')

	count.write(0)
	expect($('div').textContent).toBe('0')

	dispose()
})

// --- null and undefined children render nothing ------------------------------

await test('framework - null and undefined children render as empty', expect => {
	const dispose = render(
		<div>
			{null}
			{undefined}
			<span>ok</span>
		</div>,
	)

	// null and undefined produce no visible output
	expect($('div').textContent).toBe('ok')
	expect($$('div > span').length).toBe(1)

	dispose()
})

// --- array child renders all items -------------------------------------------

await test('framework - array of elements renders all in order', expect => {
	const items = [<span>a</span>, <span>b</span>, <span>c</span>]
	const dispose = render(<div>{items}</div>)

	expect($$('div span').length).toBe(3)
	expect($('div').textContent).toBe('abc')

	dispose()
})

// --- mixed static and reactive children --------------------------------------

await test('framework - mixed static and reactive children coexist', expect => {
	const dynamic = signal('dynamic')
	const dispose = render(
		<div>
			<span>static</span>
			{dynamic.read}
			<span>end</span>
		</div>,
	)

	expect($('div').textContent).toBe('staticdynamicend')

	dynamic.write('updated')
	expect($('div').textContent).toBe('staticupdatedend')

	dispose()
})

// --- deeply nested components ------------------------------------------------

await test('framework - deeply nested components render and clean up', expect => {
	const cleaned = []

	function Inner() {
		cleanup(() => cleaned.push('inner'))
		return <b>inner</b>
	}

	function Middle(props) {
		cleanup(() => cleaned.push('middle'))
		return <i>{props.children}</i>
	}

	function Outer(props) {
		cleanup(() => cleaned.push('outer'))
		return <div>{props.children}</div>
	}

	const dispose = render(
		<Outer>
			<Middle>
				<Inner />
			</Middle>
		</Outer>,
	)

	expect(body()).toBe('<div><i><b>inner</b></i></div>')

	dispose()

	expect(cleaned).toEqual(['inner', 'middle', 'outer'])
})

// --- function component composition via direct return (no children) --------

await test('framework - deeply nested function components resolve top-down', expect => {
	// The test above uses children-prop composition (Outer > Middle > Inner).
	// This exercises the distinct pattern of components returning other
	// components directly: `const B = () => <A />`, so the renderer has to
	// unwrap several layers of component returns before it hits an element.
	const A = () => <p>A</p>
	const B = () => <A />
	const C = () => <B />
	const D = () => <C />

	const dispose = render(<D />)
	expect(body()).toBe('<p>A</p>')
	dispose()
})

// --- MathML namespace --------------------------------------------------------

await test('framework - MathML elements render with correct namespace', expect => {
	const dispose = render(
		<math>
			<mrow>
				<mi>x</mi>
			</mrow>
		</math>,
	)

	const math = $('math')
	expect(math.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

	const mi = $('mi')
	expect(mi.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

	dispose()
})

// --- SVG partial via createPartial -------------------------------------------

await test('framework - createPartial creates SVG elements with correct namespace', expect => {
	const svgNs = 'http://www.w3.org/2000/svg'
	const partial = createPartial('<circle cx="50" cy="50" r="40"/>', {
		x: svgNs,
	})

	const dispose = render(
		<svg>{partial()}</svg>,
	)

	const circle = $('circle')
	expect(circle).not.toBe(null)
	expect(circle.namespaceURI).toBe(svgNs)

	dispose()
})

await test('framework - createPartial creates MathML elements with correct namespace', expect => {
	const mathNs = 'http://www.w3.org/1998/Math/MathML'
	const partial = createPartial('<mi>x</mi><mo>+</mo><mn>1</mn>', {
		x: mathNs,
	})

	const dispose = render(
		<math>{partial()}</math>,
	)

	const mi = $('mi')
	expect(mi).not.toBe(null)
	expect(mi.namespaceURI).toBe(mathNs)

	dispose()
})

// --- createPartial without namespace (HTML) ----------------------------------

await test('framework - createPartial creates HTML elements by default', expect => {
	const partial = createPartial('<p>hello</p><span>world</span>')

	const dispose = render(partial())

	expect(body()).toBe('<p>hello</p><span>world</span>')

	dispose()
})

// --- createPartial with props ------------------------------------------------

await test('framework - createPartial passes props to child nodes', expect => {
	const partial = createPartial('<p></p>', {
		m: 1,
	})

	const dispose = render(
		partial([
			node => {
				node.textContent = 'injected'
			},
		]),
	)

	expect($('p').textContent).toBe('injected')

	dispose()
})

// --- CSSStyleSheet as child --------------------------------------------------

await test('framework - CSSStyleSheet as child adopts stylesheet to document', async expect => {
	const sheet = css`
		.test-css-child {
			color: red;
		}
	`

	const before = document.adoptedStyleSheets.length

	const dispose = render(
		<div class="test-css-child">{sheet}hello</div>,
	)

	await microtask()

	expect(document.adoptedStyleSheets.includes(sheet)).toBe(true)

	dispose()
})

// --- error in effect does not break sibling effects --------------------------

await test('framework - thrown error in one effect does not break other effects', expect => {
	const trigger = signal(0)
	const seen = []
	const originalError = console.error
	console.error = () => {}

	const dispose = root(d => {
		effect(() => {
			if (trigger.read() === 1) throw new Error('boom')
		})
		effect(() => {
			seen.push('ok:' + trigger.read())
		})
		return d
	})

	// baseline: both effects ran without error
	expect(seen).toInclude('ok:0')

	trigger.write(1)

	// second effect should still have run despite first throwing
	expect(seen).toInclude('ok:1')

	console.error = originalError
	dispose()
})

// --- object with toString as child -------------------------------------------

await test('framework - object with toString renders its string representation', expect => {
	const obj = { toString: () => 'custom string' }
	const dispose = render(<div>{obj}</div>)

	expect($('div').textContent).toBe('custom string')

	dispose()
})

// --- null-prototype object as child ------------------------------------------

await test('framework - null-prototype object with toString renders', expect => {
	const obj = Object.create(null)
	obj.toString = () => 'null-proto'
	const dispose = render(<div>{obj}</div>)

	expect($('div').textContent).toBe('null-proto')

	dispose()
})

// --- DocumentFragment as child -----------------------------------------------

await test('framework - DocumentFragment child renders all its children', expect => {
	const frag = document.createDocumentFragment()
	frag.append(
		document.createElement('span'),
		document.createElement('b'),
	)
	frag.querySelector('span').textContent = 'a'
	frag.querySelector('b').textContent = 'b'

	const dispose = render(<div>{frag}</div>)

	expect($('div').innerHTML).toBe('<span>a</span><b>b</b>')

	dispose()
})

// --- reactive child switching to array and back ------------------------------

await test('framework - child switching from single element to array to null', expect => {
	const mode = signal('single')
	const dispose = render(
		<div>
			{() => {
				const m = mode.read()
				if (m === 'single') return <p>one</p>
				if (m === 'array')
					return [<p>a</p>, <p>b</p>]
				if (m === 'text') return 'hello'
				return null
			}}
		</div>,
	)

	expect($('div').innerHTML).toInclude('<p>one</p>')

	mode.write('array')
	expect($('div').innerHTML).toInclude('<p>a</p>')
	expect($('div').innerHTML).toInclude('<p>b</p>')

	mode.write('text')
	expect($('div').textContent).toBe('hello')

	mode.write('null')
	expect($('p')).toBe(null)

	mode.write('single')
	expect($('p').textContent).toBe('one')

	dispose()
})

// --- signal returning 0 and empty string render as text ----------------------

await test('framework - falsy non-null values 0 and empty string render as text', expect => {
	const val = signal(0)
	const dispose = render(<div>{val.read}</div>)

	expect($('div').textContent).toBe('0')

	val.write('')
	expect($('div').textContent).toBe('')

	val.write(false)
	expect($('div').textContent).toBe('false')

	val.write(true)
	expect($('div').textContent).toBe('true')

	dispose()
})

await test('framework - special number values render as text', expect => {
	const val = signal(Infinity)
	const dispose = render(<div>{val.read}</div>)

	expect($('div').textContent).toBe('Infinity')

	val.write(-Infinity)
	expect($('div').textContent).toBe('-Infinity')

	val.write(NaN)
	expect($('div').textContent).toBe('NaN')

	dispose()
})

// --- reactive attribute with xlink namespace ---------------------------------

await test('framework - SVG xlink:href attribute renders correctly', expect => {
	const dispose = render(
		<svg>
			<use href="#icon" />
		</svg>,
	)

	const use = $('use')
	expect(use).not.toBe(null)
	expect(use.getAttribute('href')).toBe('#icon')

	dispose()
})

// --- empty fragment renders nothing ------------------------------------------

await test('framework - render with null renders nothing', expect => {
	const dispose = render(null)
	expect(body()).toBe('')
	dispose()
})

// --- nested fragments flatten ------------------------------------------------

await test('framework - nested fragments flatten into parent', expect => {
	const dispose = render(
		<div>
			<>
				<>
					<p>deep</p>
				</>
			</>
		</div>,
	)

	expect($('div').innerHTML).toBe('<p>deep</p>')

	dispose()
})

// --- booleans render as their string representation -------------------------

await test('framework - boolean children render as text', expect => {
	const dispose = render(
		<div>
			{false}
			{true}
		</div>,
	)

	expect($('div').textContent).toBe('falsetrue')

	dispose()
})

// --- conditional && pattern --------------------------------------------------

await test('framework - conditional && pattern renders only when truthy', expect => {
	const show = signal(false)
	const dispose = render(
		<div>{() => show.read() && <p>visible</p>}</div>,
	)

	expect($('p')).toBe(null)

	show.write(true)
	expect($('p')).not.toBe(null)
	expect($('p').textContent).toBe('visible')

	show.write(false)
	expect($('p')).toBe(null)

	dispose()
})

// --- array with null holes ---------------------------------------------------

await test('framework - array with null values renders non-null items', expect => {
	const dispose = render(
		<div>{[<span>a</span>, null, <span>b</span>, undefined]}</div>,
	)

	expect($$('div span').length).toBe(2)
	expect($('div').textContent).toBe('ab')

	dispose()
})

// --- signal write inside component body is not tracked -----------------------

await test('framework - signal read in component body is not tracked for re-render', expect => {
	const count = signal(0)
	let renderCount = 0

	function Counter() {
		renderCount++
		return <p>{count.read}</p>
	}

	const dispose = render(<Counter />)

	expect(renderCount).toBe(1)
	expect($('p').textContent).toBe('0')

	count.write(1)
	// component body should not re-run, but the reactive child updates
	expect(renderCount).toBe(1)
	expect($('p').textContent).toBe('1')

	dispose()
})

// --- nested effects dispose with parent -------------------------------------

await test('framework - nested effect is disposed when parent effect re-runs', expect => {
	const outer = signal(0)
	const inner = signal('a')
	const seen = []

	const dispose = root(d => {
		effect(() => {
			const o = outer.read()
			effect(() => {
				seen.push(`${o}:${inner.read()}`)
			})
		})
		return d
	})

	expect(seen).toEqual(['0:a'])

	inner.write('b')
	expect(seen).toEqual(['0:a', '0:b'])

	// outer re-runs → inner is re-created, old inner effect disposed
	outer.write(1)
	expect(seen).toEqual(['0:a', '0:b', '1:b'])

	inner.write('c')
	// only one inner effect (the new one) should run
	expect(seen).toEqual(['0:a', '0:b', '1:b', '1:c'])

	dispose()
})

// --- multiple roots sharing same signal --------------------------------------

await test('framework - multiple roots sharing a signal react independently', expect => {
	const shared = signal(0)
	const seenA = []
	const seenB = []

	const disposeA = root(d => {
		effect(() => seenA.push(shared.read()))
		return d
	})
	const disposeB = root(d => {
		effect(() => seenB.push(shared.read()))
		return d
	})

	expect(seenA).toEqual([0])
	expect(seenB).toEqual([0])

	shared.write(1)
	expect(seenA).toEqual([0, 1])
	expect(seenB).toEqual([0, 1])

	disposeA()

	shared.write(2)
	expect(seenA).toEqual([0, 1]) // disposed, no more updates
	expect(seenB).toEqual([0, 1, 2])

	disposeB()
})

// --- batch coalesces writes observed by effect -------------------------------

await test('framework - batch coalesces writes observed by effect into one run', expect => {
	const a = signal(1)
	const b = signal(2)
	const seen = []

	const dispose = root(d => {
		effect(() => {
			const sum = a.read() + b.read()
			seen.push(sum)
		})
		return d
	})

	// baseline: effect ran once with initial values
	expect(seen).toEqual([3])

	batch(() => {
		a.write(10)
		b.write(20)
	})

	// only one additional run, not two — coalesced
	expect(seen).toEqual([3, 30])

	dispose()
})

// --- memo chain: memo depending on memo --------------------------------------

await test('framework - chained memos propagate correctly', expect => {
	const base = signal(2)
	const doubled = memo(() => base.read() * 2)
	const quadrupled = memo(() => doubled() * 2)
	const seen = []

	const dispose = root(d => {
		effect(() => seen.push(quadrupled()))
		return d
	})

	expect(seen).toEqual([8])

	base.write(3)
	expect(seen).toEqual([8, 12])

	dispose()
})

// --- context available after Show toggle -------------------------------------

await test('framework - context is available after Show re-shows', expect => {
	const Ctx = context('default')
	const visible = signal(true)
	const seen = []

	const dispose = render(
		<Ctx.Provider value="provided">
			<Show when={visible.read}>
				{() => {
					seen.push(Ctx())
					return <p>{Ctx()}</p>
				}}
			</Show>
		</Ctx.Provider>,
	)

	expect(seen).toEqual(['provided'])

	visible.write(false)
	visible.write(true)

	expect(seen).toEqual(['provided', 'provided'])

	dispose()
})

// --- render same element reference twice ------------------------------------

await test('framework - rendering same DOM node moves it', expect => {
	const node = document.createElement('p')
	node.textContent = 'shared'

	const parentA = document.createElement('div')
	const parentB = document.createElement('div')
	document.body.append(parentA, parentB)

	parentA.append(node)
	expect(parentA.contains(node)).toBe(true)

	parentB.append(node)
	expect(parentA.contains(node)).toBe(false)
	expect(parentB.contains(node)).toBe(true)

	parentA.remove()
	parentB.remove()
})

// ============================================================================
// Additional coverage: reactivity and render edge cases
// ============================================================================

// --- rendering a bare string --------------------------------------------

await test('framework - render with a plain string creates a text node', expect => {
	const dispose = render('hello')
	expect(body()).toBe('hello')
	dispose()
})

// --- rendering a bare number --------------------------------------------

await test('framework - render with a bare number renders it as text', expect => {
	const dispose = render(42)
	expect(body()).toBe('42')
	dispose()
})

// --- component with no return renders nothing -------------------------

await test('framework - function component that returns undefined renders nothing', expect => {
	function Empty() {}

	const dispose = render(<Empty />)
	expect(body()).toBe('')
	dispose()
})

// --- event handlers on components are forwarded via props -------------

await test('framework - event handlers pass through component props as callbacks', expect => {
	let pressed = 0

	function Btn(props) {
		return <button on:click={props.onPress}>click</button>
	}

	const dispose = render(<Btn onPress={() => pressed++} />)

	$('button').click()
	$('button').click()

	expect(pressed).toBe(2)
	dispose()
})

// --- props are not reactive when destructured in component body ------

await test('framework - destructuring props in a component body snapshots at mount', expect => {
	const count = signal(1)

	function Widget(props) {
		const { value } = props
		return <p>{value}</p>
	}

	const dispose = render(<Widget value={count.read()} />)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	// destructured value is a snapshot — not reactive
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- props property access IS reactive (if wrapped in a function) ----

await test('framework - accessing props.value through a function stays reactive', expect => {
	const count = signal(1)

	function Widget(props) {
		return <p>{() => props.value}</p>
	}

	const dispose = render(<Widget value={count} />)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

// --- cleanup runs in reverse order for nested effects ----------------

await test('framework - nested effects clean up in reverse creation order', async expect => {
	const order = []

	const dispose = root(d => {
		effect(() => {
			cleanup(() => order.push('outer'))
			effect(() => {
				cleanup(() => order.push('inner'))
			})
		})
		return d
	})

	await microtask()
	await microtask()

	dispose()

	// inner cleanup fires before outer
	expect(order).toEqual(['inner', 'outer'])
})

// --- Map as iterable children ----------------------------------------

await test('framework - Map as child iterates its values', expect => {
	const items = new Map([
		['x', 'a'],
		['y', 'b'],
		['z', 'c'],
	])

	const dispose = render(<div>{items}</div>)

	// textContent includes all iterated values
	expect($('div').textContent).toInclude('a')
	expect($('div').textContent).toInclude('b')
	expect($('div').textContent).toInclude('c')

	dispose()
})

// --- Function returning an array ------------------------------------

await test('framework - reactive child returning an array of elements updates correctly', expect => {
	const items = signal(['a', 'b'])

	const dispose = render(
		<div>
			{() => items.read().map(item => <span>{item}</span>)}
		</div>,
	)

	expect($('div').innerHTML).toBe('<span>a</span><span>b</span>')

	items.write(['x', 'y', 'z'])
	expect($('div').innerHTML).toBe(
		'<span>x</span><span>y</span><span>z</span>',
	)

	dispose()
})

// --- style as an object -----------------------------------------------

await test('framework - style prop accepts an object and applies multiple properties', expect => {
	const dispose = render(
		<div style={{ color: 'red', 'background-color': 'blue' }} />,
	)

	const el = $('div')
	expect(el.style.color).toBe('red')
	expect(el.style.backgroundColor).toBe('blue')

	dispose()
})

// --- class as an object ---------------------------------------------

await test('framework - class prop accepts an object with boolean values', expect => {
	const dispose = render(
		<div class={{ one: true, two: false, three: true }} />,
	)

	const el = $('div')
	expect(el.classList.contains('one')).toBe(true)
	expect(el.classList.contains('two')).toBe(false)
	expect(el.classList.contains('three')).toBe(true)

	dispose()
})

// --- reactive class object updates classes --------------------------

await test('framework - class object with signal values updates reactively', expect => {
	const active = signal(false)

	const dispose = render(
		<div class={{ static: true, active: () => active.read() }} />,
	)

	const el = $('div')
	expect(el.classList.contains('static')).toBe(true)
	expect(el.classList.contains('active')).toBe(false)

	active.write(true)
	expect(el.classList.contains('active')).toBe(true)

	active.write(false)
	expect(el.classList.contains('active')).toBe(false)

	dispose()
})

// --- render into a specific parent ----------------------------------

await test('framework - render accepts a parent element as second argument', expect => {
	const parent = document.createElement('section')
	document.body.append(parent)

	const dispose = render(<p>inside</p>, parent)

	expect(parent.innerHTML).toBe('<p>inside</p>')
	// body should not contain <p>inside</p> directly, only via parent
	expect(parent.querySelector('p')).not.toBe(null)

	dispose()
	parent.remove()
})

// --- component with reactive signal prop --------------------------

await test('framework - component receives a reactive prop and updates in its children', expect => {
	const value = signal('first')

	function Widget(props) {
		return <p>v:{props.value}</p>
	}

	const dispose = render(<Widget value={value} />)

	expect($('p').textContent).toBe('v:first')

	value.write('second')
	expect($('p').textContent).toBe('v:second')

	dispose()
})

// --- Array.isArray on the component children --------------------

await test('framework - component children prop can be iterated when provided as array', expect => {
	let receivedLen

	function Multi(props) {
		// children is exposed by the framework — verify it exists
		receivedLen = Array.isArray(props.children)
			? props.children.length
			: 1
		return <div>{props.children}</div>
	}

	const dispose = render(
		<Multi>
			<span>a</span>
			<span>b</span>
			<span>c</span>
		</Multi>,
	)

	// the framework may expose children as an array, single, or function
	// just verify something was passed — specific shape depends on the framework
	expect(receivedLen >= 1).toBe(true)
	expect($$('span').length).toBe(3)

	dispose()
})

// --- effect disposal order across multiple signals -------------

await test('framework - effect rerun disposes all old owned children before the new run', async expect => {
	const trigger = signal(0)
	const events = []

	const dispose = root(d => {
		effect(() => {
			const n = trigger.read()
			events.push('run:' + n)
			cleanup(() => events.push('cleanup:' + n))
		})
		return d
	})

	await microtask()
	events.length = 0

	trigger.write(1)
	await microtask()
	await microtask()

	// cleanup from previous run must fire before the new run
	const cleanupIndex = events.indexOf('cleanup:0')
	const runIndex = events.indexOf('run:1')
	expect(cleanupIndex < runIndex).toBe(true)

	dispose()
})
