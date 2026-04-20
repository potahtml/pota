/** @jsxImportSource pota */

// Tests for the renderer's handling of reactive children — type
// switching (text/array/element/null/empty), text-node reuse, fragment
// flattening, batch coalescing, falsy/special number rendering,
// keyed list reordering, conditional patterns, Portal mount.

import { $, $$, body, test } from '#test'
import { batch, cleanup, effect, render, signal } from 'pota'
import { For, Portal, Show } from 'pota/components'

await test('rendering - reactive children can switch between text, arrays, elements and empty without corrupting sibling order', expect => {
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

await test('rendering - conditional branches dispose owned effects exactly when unmounted and recreate cleanly', expect => {
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

await test('rendering - keyed list reordering preserves DOM node identity and uncontrolled input state', expect => {
	const first = { id: 'a', label: 'A' }
	const second = { id: 'b', label: 'B' }
	const items = signal([first, second])
	const dispose = render(
		<For each={items.read}>
			{item => <input data-id={item.id} value={item.label} />}
		</For>,
	)

	const firstNode = /** @type {HTMLInputElement} */ (
		$('[data-id="a"]')
	)
	const secondNode = /** @type {HTMLInputElement} */ (
		$('[data-id="b"]')
	)

	firstNode.value = 'typed A'
	secondNode.value = 'typed B'

	items.write([second, first])

	expect($$('input')[0]).toBe(secondNode)
	expect($$('input')[1]).toBe(firstNode)
	expect(
		/** @type {HTMLInputElement} */ ($('[data-id="a"]')).value,
	).toBe('typed A')
	expect(
		/** @type {HTMLInputElement} */ ($('[data-id="b"]')).value,
	).toBe('typed B')

	dispose()
})

await test('rendering - Portal content is mounted outside the local tree and still cleans up with the owner', expect => {
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

// --- text node reuse ---------------------------------------------------------

await test('rendering - reactive text updates reuse the same text node', expect => {
	const text = signal('hello')
	const dispose = render(<div>{text.read}</div>)

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

await test('rendering - reactive child switching between element and null cleans up', expect => {
	const show = signal(true)
	const dispose = render(
		<div>{() => (show.read() ? <p>yes</p> : null)}</div>,
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

// --- glitch-free rendering ---------------------------------------------------

await test('rendering - batch prevents intermediate DOM states', expect => {
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

await test('rendering - number child renders as text content', expect => {
	const count = signal(42)
	const dispose = render(<div>{count.read}</div>)

	expect($('div').textContent).toBe('42')

	count.write(0)
	expect($('div').textContent).toBe('0')

	dispose()
})

// --- null and undefined children render nothing ------------------------------

await test('rendering - null and undefined children render as empty', expect => {
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

await test('rendering - array of elements renders all in order', expect => {
	const items = [<span>a</span>, <span>b</span>, <span>c</span>]
	const dispose = render(<div>{items}</div>)

	expect($$('div span').length).toBe(3)
	expect($('div').textContent).toBe('abc')

	dispose()
})

// --- mixed static and reactive children --------------------------------------

await test('rendering - mixed static and reactive children coexist', expect => {
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

// --- reactive child switching to array and back ------------------------------

await test('rendering - child switching from single element to array to null', expect => {
	const mode = signal('single')
	const dispose = render(
		<div>
			{() => {
				const m = mode.read()
				if (m === 'single') return <p>one</p>
				if (m === 'array') return [<p>a</p>, <p>b</p>]
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

await test('rendering - falsy non-null values 0 and empty string render as text, booleans render as nothing', expect => {
	const val = signal(/** @type {number | string | boolean} */ (0))
	const dispose = render(<div>{val.read}</div>)

	expect($('div').textContent).toBe('0')

	val.write('')
	expect($('div').textContent).toBe('')

	// booleans are suppressed by the renderer
	val.write(false)
	expect($('div').textContent).toBe('')

	val.write(true)
	expect($('div').textContent).toBe('')

	dispose()
})

await test('rendering - special number values render as text', expect => {
	const val = signal(Infinity)
	const dispose = render(<div>{val.read}</div>)

	expect($('div').textContent).toBe('Infinity')

	val.write(-Infinity)
	expect($('div').textContent).toBe('-Infinity')

	val.write(NaN)
	expect($('div').textContent).toBe('NaN')

	dispose()
})

// --- nested fragments flatten ------------------------------------------------

await test('rendering - nested fragments flatten into parent', expect => {
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

// --- booleans render as nothing ---------------------------------------------

await test('rendering - boolean literal children are filtered out', expect => {
	const dispose = render(
		<div>
			{false}
			{true}
		</div>,
	)

	expect($('div').textContent).toBe('')

	dispose()
})

// --- conditional && pattern --------------------------------------------------

await test('rendering - conditional && pattern renders only when truthy', expect => {
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

await test('rendering - array with null values renders non-null items', expect => {
	const dispose = render(
		<div>{[<span>a</span>, null, <span>b</span>, undefined]}</div>,
	)

	expect($$('div span').length).toBe(2)
	expect($('div').textContent).toBe('ab')

	dispose()
})

// --- Function returning an array ------------------------------------

await test('rendering - reactive child returning an array of elements updates correctly', expect => {
	const items = signal(['a', 'b'])

	const dispose = render(
		<div>{() => items.read().map(item => <span>{item}</span>)}</div>,
	)

	expect($('div').innerHTML).toBe('<span>a</span><span>b</span>')

	items.write(['x', 'y', 'z'])
	expect($('div').innerHTML).toBe(
		'<span>x</span><span>y</span><span>z</span>',
	)

	dispose()
})
