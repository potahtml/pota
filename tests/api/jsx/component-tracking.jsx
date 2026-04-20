/** @jsxImportSource pota */

// Tests that verify reactive tracking in component callbacks.
// When a callback accesses a value through an accessor (v()),
// wrapping the usage in () => makes it reactive — without the
// wrapper the value is read once and never updates.
import { test, body } from '#test'

import { render, signal } from 'pota'
import {
	Collapse,
	Dynamic,
	For,
	Head,
	Match,
	Normalize,
	Portal,
	Range,
	Show,
	Suspense,
	Switch,
} from 'pota/components'

// --- Show: wrapped in arrow function → updates ------------------------------

await test('tracking - Show callback wrapped in () => updates reactively', expect => {
	const count = signal(1)

	const dispose = render(
		<Show when={count.read}>{v => <p>{() => v()}</p>}</Show>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	count.write(3)
	expect(body()).toBe('<p>3</p>')

	dispose()
})

// --- Show: NOT wrapped → does NOT update ------------------------------------

await test('tracking - Show callback without () => does not update', expect => {
	const count = signal(1)

	const dispose = render(
		<Show when={count.read}>{v => <p>{v()}</p>}</Show>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	// v() was read once at render time, not tracked
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- Show: derived property wrapped → updates -------------------------------

await test('tracking - Show callback with derived property wrapped updates', expect => {
	const user = signal({ name: 'Ada' })

	const dispose = render(
		<Show when={user.read}>{v => <p>{() => v().name}</p>}</Show>,
	)

	expect(body()).toBe('<p>Ada</p>')

	user.write({ name: 'Grace' })
	expect(body()).toBe('<p>Grace</p>')

	dispose()
})

// --- Show: derived property NOT wrapped → does NOT update -------------------

await test('tracking - Show callback with derived property unwrapped does not update', expect => {
	const user = signal({ name: 'Ada' })

	const dispose = render(
		<Show when={user.read}>{v => <p>{v().name}</p>}</Show>,
	)

	expect(body()).toBe('<p>Ada</p>')

	user.write({ name: 'Grace' })
	expect(body()).toBe('<p>Ada</p>')

	dispose()
})

// --- Switch/Match: wrapped → updates ----------------------------------------

await test('tracking - Switch callback wrapped in () => updates reactively', expect => {
	const count = signal(1)

	const dispose = render(
		<Switch>
			<Match when={count.read}>{v => <p>{() => v()}</p>}</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(5)
	expect(body()).toBe('<p>5</p>')

	dispose()
})

// --- Switch/Match: NOT wrapped → does NOT update ----------------------------

await test('tracking - Switch callback without () => does not update', expect => {
	const count = signal(1)

	const dispose = render(
		<Switch>
			<Match when={count.read}>{v => <p>{v()}</p>}</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(5)
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- Switch/Match: derived property wrapped → updates -----------------------

await test('tracking - Switch callback with derived property wrapped updates', expect => {
	const user = signal({ name: 'Ada' })

	const dispose = render(
		<Switch>
			<Match when={user.read}>{v => <p>{() => v().name}</p>}</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>Ada</p>')

	user.write({ name: 'Grace' })
	expect(body()).toBe('<p>Grace</p>')

	dispose()
})

// --- Switch/Match: derived property NOT wrapped → does NOT update -----------

await test('tracking - Switch callback with derived property unwrapped does not update', expect => {
	const user = signal({ name: 'Ada' })

	const dispose = render(
		<Switch>
			<Match when={user.read}>{v => <p>{v().name}</p>}</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>Ada</p>')

	user.write({ name: 'Grace' })
	expect(body()).toBe('<p>Ada</p>')

	dispose()
})

// --- For: item value is static, index wrapped → updates ---------------------

await test('tracking - For index wrapped in () => updates on reorder', expect => {
	const items = signal(['a', 'b', 'c'])

	const dispose = render(
		<For each={items.read} reactiveIndex>
			{(item, index) => (
				<p>
					{() => index()}:{item}
				</p>
			)}
		</For>,
	)

	expect(body()).toBe('<p>0:a</p><p>1:b</p><p>2:c</p>')

	items.write(['c', 'a', 'b'])
	expect(body()).toBe('<p>0:c</p><p>1:a</p><p>2:b</p>')

	dispose()
})

// --- For: index NOT wrapped → does NOT update on reorder --------------------

await test('tracking - For index without () => does not update on reorder', expect => {
	const items = signal(['a', 'b', 'c'])

	const dispose = render(
		<For each={items.read} reactiveIndex>
			{(item, index) => (
				<p>
					{index()}:{item}
				</p>
			)}
		</For>,
	)

	expect(body()).toBe('<p>0:a</p><p>1:b</p><p>2:c</p>')

	items.write(['c', 'a', 'b'])
	// indices were read once at creation, items reordered but
	// index text is baked in — only new items get fresh indices
	expect(body()).toInclude(':c')
	expect(body()).toInclude(':a')
	expect(body()).toInclude(':b')

	dispose()
})

// --- Show: when becomes falsy then truthy again, callback re-reads ----------

await test('tracking - Show wrapped callback re-reads fresh value after toggle', expect => {
	const count = signal(1)

	const dispose = render(
		<Show when={count.read}>{v => <p>{() => v()}</p>}</Show>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(0) // falsy — hides
	expect(body()).toBe('')

	count.write(99) // truthy again — re-shows
	expect(body()).toBe('<p>99</p>')

	dispose()
})

// --- Show: signal passed directly as child (not in callback) is reactive ----

await test('tracking - signal passed directly to Show children is reactive', expect => {
	const count = signal(1)

	const dispose = render(
		<Show when={true}>{() => <p>{count.read}</p>}</Show>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

// --- Switch: signal passed directly (not in callback) is reactive -----------

await test('tracking - signal passed directly to Match children is reactive', expect => {
	const count = signal(1)

	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>{count.read}</p>
			</Match>
		</Switch>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

// --- Range: wrapped → updates -----------------------------------------------

await test('tracking - Range callback renders item values', expect => {
	const dispose = render(
		<Range start={0} stop={2}>
			{(item, index) => (
				<p>
					{index}:{item}
				</p>
			)}
		</Range>,
	)

	expect(body()).toBe('<p>0:0</p><p>1:1</p><p>2:2</p>')

	dispose()
})

await test('tracking - Range with reactive start updates children', expect => {
	const start = signal(0)

	const dispose = render(
		<Range start={start.read} stop={2}>
			{item => <p>{item}</p>}
		</Range>,
	)

	expect(body()).toInclude('<p>0</p>')

	start.write(1)
	expect(body()).toInclude('<p>1</p>')
	expect(body()).not.toInclude('<p>0</p>')

	dispose()
})

// --- Dynamic: signal inside children is reactive ----------------------------

await test('tracking - Dynamic children with signal accessor are reactive', expect => {
	const count = signal(1)

	const dispose = render(
		<Dynamic component="p">{count.read}</Dynamic>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

await test('tracking - Dynamic children with signal called once are static', expect => {
	const count = signal(1)

	const dispose = render(
		<Dynamic component="p">{count.read()}</Dynamic>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- Collapse: signal inside children is reactive ---------------------------

await test('tracking - Collapse children with signal accessor are reactive', expect => {
	const count = signal(1)

	const dispose = render(
		<Collapse when={true}>
			<p>{count.read}</p>
		</Collapse>,
	)

	expect(document.querySelector('p').textContent).toBe('1')

	count.write(2)
	expect(document.querySelector('p').textContent).toBe('2')

	dispose()
})

await test('tracking - Collapse children with signal called once are static', expect => {
	const count = signal(1)

	const dispose = render(
		<Collapse when={true}>
			<p>{count.read()}</p>
		</Collapse>,
	)

	expect(document.querySelector('p').textContent).toBe('1')

	count.write(2)
	expect(document.querySelector('p').textContent).toBe('1')

	dispose()
})

// --- Portal: signal inside children is reactive -----------------------------

await test('tracking - Portal children with signal accessor are reactive', expect => {
	const mount = document.createElement('div')
	document.body.append(mount)
	const count = signal(1)

	const dispose = render(
		<Portal mount={mount}>
			<p>{count.read}</p>
		</Portal>,
	)

	expect(mount.querySelector('p').textContent).toBe('1')

	count.write(2)
	expect(mount.querySelector('p').textContent).toBe('2')

	dispose()
	mount.remove()
})

await test('tracking - Portal children with signal called once are static', expect => {
	const mount = document.createElement('div')
	document.body.append(mount)
	const count = signal(1)

	const dispose = render(
		<Portal mount={mount}>
			<p>{count.read()}</p>
		</Portal>,
	)

	expect(mount.querySelector('p').textContent).toBe('1')

	count.write(2)
	expect(mount.querySelector('p').textContent).toBe('1')

	dispose()
	mount.remove()
})

// --- Normalize: signal accessor is reactive ---------------------------------

await test('tracking - Normalize children with signal accessor are reactive', expect => {
	const count = signal(1)

	const dispose = render(<Normalize>{count.read}</Normalize>)

	expect(body()).toBe('1')

	count.write(2)
	expect(body()).toBe('2')

	dispose()
})

await test('tracking - Normalize children with signal called once are static', expect => {
	const count = signal(1)

	const dispose = render(<Normalize>{count.read()}</Normalize>)

	expect(body()).toBe('1')

	count.write(2)
	expect(body()).toBe('1')

	dispose()
})

// --- Suspense: signal inside children is reactive after resolve -------------

await test('tracking - Suspense children with signal accessor are reactive', expect => {
	const count = signal(1)

	const dispose = render(
		<Suspense>
			<p>{count.read}</p>
		</Suspense>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

await test('tracking - Suspense children with signal called once are static', expect => {
	const count = signal(1)

	const dispose = render(
		<Suspense>
			<p>{count.read()}</p>
		</Suspense>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- plain JSX: signal accessor vs called -----------------------------------

await test('tracking - plain JSX with signal accessor is reactive', expect => {
	const count = signal(1)

	const dispose = render(<p>{count.read}</p>)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>2</p>')

	dispose()
})

await test('tracking - plain JSX with signal called once is static', expect => {
	const count = signal(1)

	const dispose = render(<p>{count.read()}</p>)

	expect(body()).toBe('<p>1</p>')

	count.write(2)
	expect(body()).toBe('<p>1</p>')

	dispose()
})

// --- wrapping in arrow with plain access makes it reactive ---------

await test('tracking - arrow wrapping signal access makes it reactive', expect => {
	const count = signal(1)

	const dispose = render(<p>{() => count.read()}</p>)

	expect(body()).toBe('<p>1</p>')

	count.write(5)
	expect(body()).toBe('<p>5</p>')

	dispose()
})

// --- For with signal.read is reactive to items --------------------

await test('tracking - For items prop as signal.read is reactive', expect => {
	const items = signal([1, 2, 3])

	const dispose = render(
		<For each={items.read}>{v => <p>{v}</p>}</For>,
	)

	expect(body()).toBe('<p>1</p><p>2</p><p>3</p>')

	items.write([10, 20])
	expect(body()).toBe('<p>10</p><p>20</p>')

	dispose()
})

// --- static function child reads value once ---------------------

await test('tracking - component with non-function child uses snapshot', expect => {
	const name = signal('Ada')

	function Greeter(props) {
		// reading name.read() once at component mount
		return <p>hello {props.label}</p>
	}

	const dispose = render(<Greeter label={name.read()} />)

	expect(body()).toBe('<p>hello Ada</p>')

	name.write('Grace')
	// still shows Ada because it was snapshot at mount time
	expect(body()).toBe('<p>hello Ada</p>')

	dispose()
})
