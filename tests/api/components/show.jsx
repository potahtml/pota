/** @jsxImportSource pota */

// Tests for the Show component: static truthy/falsy, signal toggling,
// fallback, children-as-callback, arrays, nesting, and async children.
import { test, body, microtask } from '#test'

import { context, render, signal } from 'pota'
import { Show } from 'pota/components'

await test('Show - renders children when `when` is true', expect => {
	const dispose = render(
		<Show when={true}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('Show - renders fallback when `when` is false', expect => {
	const dispose = render(
		<Show when={false} fallback={<p>fallback</p>} />,
	)
	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

await test('Show - renders nothing when `when` is false and no fallback', expect => {
	const dispose = render(
		<Show when={false}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('')

	dispose()
})

await test('Show - renders nothing when `when` is null', expect => {
	const dispose = render(
		<Show when={null}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('')

	dispose()
})

await test('Show - renders nothing when `when` is undefined', expect => {
	const dispose = render(
		<Show when={undefined}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('')

	dispose()
})

await test('Show - renders nothing when `when` is 0', expect => {
	const dispose = render(
		<Show when={0}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('')

	dispose()
})

await test('Show - renders when `when` is a non-empty string', expect => {
	const dispose = render(
		<Show when="hello">
			<p>content</p>
		</Show>,
	)
	expect(body()).toBe('<p>content</p>')

	dispose()
})

await test('Show - renders when `when` is a non-zero number', expect => {
	const dispose = render(
		<Show when={42}>
			<p>content</p>
		</Show>,
	)
	expect(body()).toBe('<p>content</p>')

	dispose()
})

await test('Show - signal: starts truthy', expect => {
	const visible = signal(true)
	const dispose = render(
		<Show when={visible.read}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('Show - signal: starts falsy', expect => {
	const visible = signal(false)
	const dispose = render(
		<Show when={visible.read} fallback={<p>fallback</p>}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

await test('Show - signal: toggles from true to false', expect => {
	const visible = signal(true)
	const dispose = render(
		<Show when={visible.read} fallback={<p>fallback</p>}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')
	visible.write(false)
	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

await test('Show - signal: toggles from false to true', expect => {
	const visible = signal(false)
	const dispose = render(
		<Show when={visible.read} fallback={<p>fallback</p>}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>fallback</p>')
	visible.write(true)
	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('Show - signal: toggles multiple times', expect => {
	const visible = signal(true)
	const dispose = render(
		<Show when={visible.read} fallback={<p>fallback</p>}>
			<p>hello</p>
		</Show>,
	)
	expect(body()).toBe('<p>hello</p>')
	visible.write(false)
	expect(body()).toBe('<p>fallback</p>')
	visible.write(true)
	expect(body()).toBe('<p>hello</p>')
	visible.write(false)
	expect(body()).toBe('<p>fallback</p>')

	dispose()
})

await test('Show - signal: reactive value updates inside callback when signal changes', expect => {
	// Note: use {v} not {v()} inside JSX - passing the function lets pota track it reactively
	const val = signal(/** @type {string | boolean} */ ('a'))
	const dispose = render(
		<Show when={val.read} fallback={<p>gone</p>}>
			{v => <p>{v}</p>}
		</Show>,
	)
	expect(body()).toBe('<p>a</p>')
	val.write('b')
	expect(body()).toBe('<p>b</p>')
	val.write(false)
	expect(body()).toBe('<p>gone</p>')
	val.write('c')
	expect(body()).toBe('<p>c</p>')

	dispose()
})

await test('Show - single children callback receives the `when` value', expect => {
	const dispose = render(
		<Show when="world">{v => <p>{v()}</p>}</Show>,
	)
	expect(body()).toBe('<p>world</p>')

	dispose()
})

await test('Show - array of callbacks: all receive the `when` value', expect => {
	const dispose = render(
		<Show when="x">
			{v => <p>{v()}-1</p>}
			{v => <p>{v()}-2</p>}
		</Show>,
	)
	expect(body()).toBe('<p>x-1</p><p>x-2</p>')

	dispose()
})

await test('Show - array of mixed elements and callbacks', expect => {
	const dispose = render(
		<Show when="y">
			<span>static</span>
			{v => <p>{v()}-dynamic</p>}
		</Show>,
	)
	expect(body()).toBe('<span>static</span><p>y-dynamic</p>')

	dispose()
})

await test('Show - array of callbacks reacts to signal toggle', expect => {
	const val = signal(/** @type {string | boolean} */ ('a'))
	const dispose = render(
		<Show when={val.read} fallback={<p>gone</p>}>
			{v => <p>{v()}-1</p>}
			{v => <p>{v()}-2</p>}
		</Show>,
	)
	expect(body()).toBe('<p>a-1</p><p>a-2</p>')
	val.write(false)
	expect(body()).toBe('<p>gone</p>')
	val.write('b')
	expect(body()).toBe('<p>b-1</p><p>b-2</p>')

	dispose()
})

await test('Show - multiple static children render all of them', expect => {
	const dispose = render(
		<Show when={true}>
			<p>one</p>
			<p>two</p>
			<p>three</p>
		</Show>,
	)
	expect(body()).toBe('<p>one</p><p>two</p><p>three</p>')

	dispose()
})

await test('Show - nested: both true renders inner children', expect => {
	const dispose = render(
		<Show when={true}>
			<Show when={true}>
				<p>inner</p>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>inner</p>')

	dispose()
})

await test('Show - nested: outer false hides everything', expect => {
	const dispose = render(
		<Show when={false} fallback={<p>outer fallback</p>}>
			<Show when={true}>
				<p>inner</p>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>outer fallback</p>')

	dispose()
})

await test('Show - nested: outer true, inner false shows inner fallback', expect => {
	const dispose = render(
		<Show when={true}>
			<Show when={false} fallback={<p>inner fallback</p>}>
				<p>inner</p>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>inner fallback</p>')

	dispose()
})

await test('Show - nested: toggling outer signal also hides inner', expect => {
	const outer = signal(true)
	const inner = signal(true)
	const dispose = render(
		<Show when={outer.read} fallback={<p>outer fallback</p>}>
			<Show when={inner.read} fallback={<p>inner fallback</p>}>
				<p>content</p>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>content</p>')
	inner.write(false)
	expect(body()).toBe('<p>inner fallback</p>')
	outer.write(false)
	expect(body()).toBe('<p>outer fallback</p>')
	outer.write(true)
	expect(body()).toBe('<p>inner fallback</p>')
	inner.write(true)
	expect(body()).toBe('<p>content</p>')

	dispose()
})

await test('Show - nested: independent signals toggle independently', expect => {
	const a = signal(true)
	const b = signal(true)
	const dispose = render(
		<Show when={true}>
			<Show when={a.read} fallback={<p>no-a</p>}>
				<p>a</p>
			</Show>
			<Show when={b.read} fallback={<p>no-b</p>}>
				<p>b</p>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	a.write(false)
	expect(body()).toBe('<p>no-a</p><p>b</p>')
	b.write(false)
	expect(body()).toBe('<p>no-a</p><p>no-b</p>')
	a.write(true)
	expect(body()).toBe('<p>a</p><p>no-b</p>')

	dispose()
})

await test('Show - nested: deeply nested three levels', expect => {
	const a = signal(true)
	const dispose = render(
		<Show when={true}>
			<Show when={a.read}>
				<Show when={true}>
					<p>deep</p>
				</Show>
			</Show>
		</Show>,
	)
	expect(body()).toBe('<p>deep</p>')
	a.write(false)
	expect(body()).toBe('')
	a.write(true)
	expect(body()).toBe('<p>deep</p>')

	dispose()
})

await test('Show - async children: renders empty until promise resolves', async expect => {
	const content = new Promise(resolve =>
		setTimeout(() => resolve(<p>async content</p>), 50),
	)
	const dispose = render(<Show when={true}>{content}</Show>)
	expect(body()).toBe('')
	await content
	await microtask()
	expect(body()).toBe('<p>async content</p>')

	dispose()
})

await test('Show - async children: does not render if when toggles false before resolve', async expect => {
	const visible = signal(true)
	const content = new Promise(resolve =>
		setTimeout(() => resolve(<p>async content</p>), 50),
	)
	const dispose = render(<Show when={visible.read}>{content}</Show>)
	visible.write(false)
	await content
	await microtask()
	expect(body()).toBe('')

	dispose()
})

await test('Show - callback v is an accessor; v() reads without tracking, only v reflects current value', expect => {
	const val = signal(42)
	const dispose = render(
		<Show when={val.read}>
			{v => (
				<p>
					{v()}-{v}
				</p>
			)}
		</Show>,
	)
	expect(body()).toBe('<p>42-42</p>')
	val.write(99)
	// Show's outer memo tracks value via v, so the callback re-runs on every change
	expect(body()).toBe('<p>42-99</p>')
	dispose()
})

await test('Show - callback returning derived function stays reactive without re-rendering Show', expect => {
	const val = signal(0.6)
	const dispose = render(
		// booleans render as nothing, so the derived function
		// stringifies the comparison result to observe the value
		<Show when={val.read}>{v => () => String(v() > 0.5)}</Show>,
	)
	expect(body()).toBe('true')
	val.write(0.3)
	expect(body()).toBe('false')
	val.write(0.8)
	expect(body()).toBe('true')
	dispose()
})

await test('Show - async children: resolves and renders content', async expect => {
	const content = new Promise(resolve =>
		setTimeout(() => resolve(<p>async content</p>), 50),
	)
	const dispose = render(<Show when={true}>{content}</Show>)
	expect(body()).toBe('')
	await content
	await microtask()
	expect(body()).toBe('<p>async content</p>')

	dispose()
})

// --- Show with non-boolean truthy values in callback -------------------------

await test('Show - truthy non-boolean when value is passed to callback', expect => {
	const dispose = render(
		<Show when={'hello'}>{v => <p>{v()}</p>}</Show>,
	)

	expect(body()).toBe('<p>hello</p>')

	dispose()
})

await test('Show - numeric truthy when value is accessible in callback', expect => {
	const count = signal(42)
	const dispose = render(
		<Show when={count.read}>{v => <p>{v()}</p>}</Show>,
	)

	expect(body()).toBe('<p>42</p>')

	count.write(0)
	expect(body()).toBe('')

	count.write(99)
	expect(body()).toBe('<p>99</p>')

	dispose()
})

// --- Show with empty string as when --------------------------------

await test('Show - empty string when is treated as falsy', expect => {
	const dispose = render(
		<Show when={''}>
			<p>content</p>
		</Show>,
	)

	expect(body()).toBe('')

	dispose()
})

// --- Show fallback is a function returning reactive ----------------

await test('Show - fallback as a function that returns reactive content', expect => {
	const flag = signal(false)
	const label = signal('loading...')

	const dispose = render(
		<Show when={flag.read} fallback={() => <p>{label.read}</p>}>
			<p>ready</p>
		</Show>,
	)

	expect(body()).toBe('<p>loading...</p>')

	label.write('waiting')
	expect(body()).toBe('<p>waiting</p>')

	flag.write(true)
	expect(body()).toBe('<p>ready</p>')

	dispose()
})

// --- Show with children returning null callback -------------------

await test('Show - children as callback returning null renders empty', expect => {
	const dispose = render(<Show when={true}>{() => null}</Show>)

	expect(body()).toBe('')

	dispose()
})

// --- Show with signal that starts at zero -----------------------

await test('Show - signal starting at 0 is initially hidden', expect => {
	const n = signal(0)
	const dispose = render(
		<Show when={n.read} fallback={<span>zero</span>}>
			<p>non-zero</p>
		</Show>,
	)

	expect(body()).toBe('<span>zero</span>')

	n.write(1)
	expect(body()).toBe('<p>non-zero</p>')

	dispose()
})

// --- Show dispose cleans up all rendered content ----------------

await test('Show - dispose removes both shown content and fallback', expect => {
	const flag = signal(true)

	const dispose = render(
		<Show when={flag.read} fallback={<span>fallback</span>}>
			<p>content</p>
		</Show>,
	)

	expect(body()).toBe('<p>content</p>')
	dispose()
	expect(body()).toBe('')
})

await test('Show - context is available after Show re-shows', expect => {
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
