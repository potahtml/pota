/** @jsxImportSource pota */

// Tests for the For component: static lists, reactive arrays,
// keyed reuse, empty fallback, and nested For loops.
import { microtask, test, body } from '#test'

import { cleanup, map, render, signal } from 'pota'
import { Show, For } from 'pota/components'

await test('For - renders a list of strings', expect => {
	const dispose = render(
		<For each={['a', 'b', 'c']}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('For - renders a list of numbers', expect => {
	const dispose = render(
		<For each={[1, 2, 3]}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>1</p><p>2</p><p>3</p>')

	dispose()
	expect(body()).toBe('')
})

await test('For - renders a single item', expect => {
	const dispose = render(
		<For each={['only']}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>only</p>')

	dispose()
})

await test('For - renders an empty array as nothing', expect => {
	const dispose = render(<For each={[]}>{item => <p>{item}</p>}</For>)
	expect(body()).toBe('')

	dispose()
})

await test('For - renders fallback when array is empty', expect => {
	const dispose = render(
		<For
			each={[]}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('For - renders fallback when each is null', expect => {
	const dispose = render(
		<For
			each={null}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('For - renders fallback when each is undefined', expect => {
	const dispose = render(
		<For
			each={undefined}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('For - passes index to children callback', expect => {
	const dispose = render(
		<For each={['a', 'b', 'c']}>
			{(item, index) => (
				<p>
					{index}-{item}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>0-a</p><p>1-b</p><p>2-c</p>')

	dispose()
})

await test('For - index starts at 0', expect => {
	const dispose = render(
		<For each={['x']}>{(item, index) => <p>{index}</p>}</For>,
	)
	expect(body()).toBe('<p>0</p>')

	dispose()
})

await test('For - renders from a signal', expect => {
	const [items] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For each={items}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('For - updates when signal adds items', expect => {
	const [items, setItems] = signal(['a', 'b'])
	const dispose = render(
		<For each={items}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	setItems(['a', 'b', 'c'])
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('For - updates when signal removes items', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For each={items}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	setItems(['a', 'b'])
	expect(body()).toBe('<p>a</p><p>b</p>')

	dispose()
})

await test('For - updates when signal replaces entire list', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For each={items}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	setItems(['x', 'y', 'z'])
	expect(body()).toBe('<p>x</p><p>y</p><p>z</p>')

	dispose()

	expect(body()).toBe('')
})

await test('For - updates when signal sets empty list', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For each={items}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	setItems([])
	expect(body()).toBe('')

	dispose()
})

await test('For - shows fallback when signal becomes empty', expect => {
	const [items, setItems] = signal(['a', 'b'])
	const dispose = render(
		<For
			each={items}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	setItems([])
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('For - hides fallback when signal becomes non-empty', expect => {
	const [items, setItems] = signal([])
	const dispose = render(
		<For
			each={items}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>empty</p>')
	setItems(['a', 'b'])
	expect(body()).toBe('<p>a</p><p>b</p>')

	dispose()
})

await test('For - toggles between content and fallback multiple times', expect => {
	const [items, setItems] = signal(['a'])
	const dispose = render(
		<For
			each={items}
			fallback={<p>empty</p>}
		>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>a</p>')
	setItems([])
	expect(body()).toBe('<p>empty</p>')
	setItems(['b'])
	expect(body()).toBe('<p>b</p>')
	setItems([])
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('For - reorders items without recreating DOM nodes', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const nodes = {}
	const dispose = render(
		<For each={items}>
			{item => {
				const el = <p>{item}</p>
				nodes[item] = el
				return el
			}}
		</For>,
	)
	const nodeA = nodes['a']
	const nodeB = nodes['b']
	const nodeC = nodes['c']
	setItems(['c', 'a', 'b'])
	expect(body()).toBe('<p>c</p><p>a</p><p>b</p>')
	// same DOM nodes, just reordered
	expect(nodes['a']).toBe(nodeA)
	expect(nodes['b']).toBe(nodeB)
	expect(nodes['c']).toBe(nodeC)

	dispose()
})

await test('For - only creates new nodes for new items', expect => {
	const [items, setItems] = signal(['a', 'b'])
	const created = []
	const dispose = render(
		<For each={items}>
			{item => {
				created.push(item)
				return <p>{item}</p>
			}}
		</For>,
	)
	expect(created).toEqual(['a', 'b'])
	setItems(['a', 'b', 'c'])
	// 'a' and 'b' should NOT be recreated
	expect(created).toEqual(['a', 'b', 'c'])

	dispose()
})

await test('For - renders duplicate primitive values', expect => {
	const dispose = render(
		<For each={[1, 2, 1, 1]}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>1</p><p>2</p><p>1</p><p>1</p>')

	dispose()
})

await test('For - renders duplicate strings', expect => {
	const dispose = render(
		<For each={['a', 'b', 'a']}>{item => <p>{item}</p>}</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>a</p>')

	dispose()
})

await test('For - accepts array of callbacks as children', expect => {
	const dispose = render(
		<For each={['a', 'b']}>
			{item => <p>{item}-1</p>}
			{item => <span>{item}-2</span>}
		</For>,
	)
	expect(body()).toBe(
		'<p>a-1</p><span>a-2</span><p>b-1</p><span>b-2</span>',
	)

	dispose()
})

await test('For - accepts mixed static and callback children', expect => {
	const dispose = render(
		<For each={['a', 'b']}>
			<hr />
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<hr><p>a</p><hr><p>b</p>')

	dispose()
})

await test('For - reactiveIndex: index is a signal accessor', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For
			each={items}
			reactiveIndex
		>
			{(item, index) => (
				<p>
					{index}-{item}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>0-a</p><p>1-b</p><p>2-c</p>')

	dispose()
})

await test('For - reactiveIndex: index updates when items are prepended', expect => {
	const [items, setItems] = signal(['b', 'c'])
	const dispose = render(
		<For
			each={items}
			reactiveIndex
		>
			{(item, index) => (
				<p>
					{index}-{item}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>0-b</p><p>1-c</p>')
	setItems(['a', 'b', 'c'])
	expect(body()).toBe('<p>0-a</p><p>1-b</p><p>2-c</p>')

	dispose()
})

await test('For - reactiveIndex: index updates when items are removed from start', expect => {
	const [items, setItems] = signal(['a', 'b', 'c'])
	const dispose = render(
		<For
			each={items}
			reactiveIndex
		>
			{(item, index) => (
				<p>
					{index}-{item}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>0-a</p><p>1-b</p><p>2-c</p>')
	setItems(['b', 'c'])
	expect(body()).toBe('<p>0-b</p><p>1-c</p>')

	dispose()
})

await test('For - accepts a Set', expect => {
	const dispose = render(
		<For each={new Set(['a', 'b', 'c'])}>
			{item => <p>{item}</p>}
		</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('For - accepts a Map', expect => {
	const dispose = render(
		<For
			each={
				new Map([
					['k1', 'v1'],
					['k2', 'v2'],
				])
			}
		>
			{(item, index) => (
				<p>
					{index}:{item}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>k1:v1</p><p>k2:v2</p>')

	dispose()
})

await test('For - renders list of objects', expect => {
	const items = [
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' },
	]
	const dispose = render(
		<For each={items}>
			{item => (
				<p>
					{item.id}-{item.name}
				</p>
			)}
		</For>,
	)
	expect(body()).toBe('<p>1-Alice</p><p>2-Bob</p>')

	dispose()
})

await test('For - object items are keyed by reference, not value', expect => {
	const a = { name: 'a' }
	const b = { name: 'b' }
	const c = { name: 'c' }
	const [items, setItems] = signal([a, b, c])
	const nodes = new Map()
	const dispose = render(
		<For each={items}>
			{item => {
				const el = <p>{item.name}</p>
				nodes.set(item, el)
				return el
			}}
		</For>,
	)
	setItems([c, a, b])
	expect(body()).toBe('<p>c</p><p>a</p><p>b</p>')
	expect(nodes.get(a)).not.toBe(undefined)
	expect(nodes.get(b)).not.toBe(undefined)
	expect(nodes.get(c)).not.toBe(undefined)

	dispose()
})

await test('For - nested: renders a 2D grid', expect => {
	const dispose = render(
		<For
			each={[
				['a', 'b'],
				['c', 'd'],
			]}
		>
			{row => (
				<div>
					<For each={row}>{item => <span>{item}</span>}</For>
				</div>
			)}
		</For>,
	)
	expect(body()).toBe(
		'<div><span>a</span><span>b</span></div>' +
			'<div><span>c</span><span>d</span></div>',
	)

	dispose()
})

await test('For - nested: outer signal update re-renders outer only', expect => {
	const [outer, setOuter] = signal(['x', 'y'])
	const dispose = render(
		<For each={outer}>
			{item => (
				<div>
					<For each={['1', '2']}>
						{sub => (
							<span>
								{item}
								{sub}
							</span>
						)}
					</For>
				</div>
			)}
		</For>,
	)
	expect(body()).toBe(
		'<div><span>x1</span><span>x2</span></div>' +
			'<div><span>y1</span><span>y2</span></div>',
	)
	setOuter(['x'])
	expect(body()).toBe('<div><span>x1</span><span>x2</span></div>')

	dispose()
})

await test('For - inside Show: hides list when Show is false', expect => {
	const [visible, setVisible] = signal(true)
	const dispose = render(
		<Show
			when={visible}
			fallback={<p>hidden</p>}
		>
			<For each={['a', 'b', 'c']}>{item => <p>{item}</p>}</For>
		</Show>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	setVisible(false)
	expect(body()).toBe('<p>hidden</p>')
	setVisible(true)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('For - Show inside For: conditionally renders each item', expect => {
	const items = [
		{ name: 'alice', active: true },
		{ name: 'bob', active: false },
		{ name: 'carol', active: true },
	]
	const dispose = render(
		<For each={items}>
			{item => (
				<Show when={item.active}>
					<p>{item.name}</p>
				</Show>
			)}
		</For>,
	)
	expect(body()).toBe('<p>alice</p><p>carol</p>')

	dispose()
})

await test('For - Show inside For with signal: toggling signal affects all items', expect => {
	const [visible, setVisible] = signal(true)
	const dispose = render(
		<For each={['a', 'b', 'c']}>
			{item => (
				<Show when={visible}>
					<p>{item}</p>
				</Show>
			)}
		</For>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	setVisible(false)
	expect(body()).toBe('')
	setVisible(true)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	dispose()
})

await test('map - works with a Set iterable', expect => {
	console.log(
		map(new Set([10, 20, 30]), item => <li>{item}</li>)().map(item =>
			item(),
		),
	)
	const dispose = render(
		<>
			{map(new Set([10, 20, 30]), item => (
				<li>{item}</li>
			))}
		</>,
	)

	expect(body()).toBe('<li>10</li><li>20</li><li>30</li>')

	dispose()
})

await test('map - works with a Map iterable (values)', expect => {
	const source = new Map([
		['a', 'alpha'],
		['b', 'beta'],
	])
	const dispose = render(map(source, item => <li>{item}</li>))

	expect(body()).toBe('<li>alpha</li><li>beta</li>')

	dispose()
})

/*


await test('map - supports reactive indices and fallback', expect => {
	const items = signal(['a'])
	const dispose = render(
		map(
			items.read,
			(item, index) => (
				<p>
					{index()}:{item}
				</p>
			),
			false,
			<p>empty</p>,
			true,
		),
	)

	expect(body()).toBe('<p>0:a</p>')

	items.write(['a', 'b'])
	expect(body()).toBe('<p>0:a</p><p>1:b</p>')

	items.write([])
	expect(body()).toBe('<p>empty</p>')

	dispose()
})

await test('map - item cleanup callback fires when item is removed', expect => {
	const removed = []
	const items = signal([1, 2, 3])

	const dispose = render(
		map(items.read, item => {
			cleanup(() => removed.push(item))
			return <li>{item}</li>
		}),
	)

	expect(body()).toBe('<li>1</li><li>2</li><li>3</li>')
	expect(removed).toEqual([])

	items.write([2, 3])

	expect(body()).toBe('<li>2</li><li>3</li>')
	expect(removed).toEqual([1])

	dispose()
})
*/
/*
await test('For - async children: renders empty until promise resolves', async expect => {
	const content = new Promise(resolve =>
		setTimeout(() => resolve(<p>loaded</p>), 100),
	)
	const dispose = render(
		<For each={['a', 'b']}>
			{item => {
				console.log(item, content)

				return (
					<>
						{item}
						{content}
					</>
				)
			}}
		</For>,
	)

	expect(body()).toBe('ab')
	await content
	console.log(await content)
	await microtask()
	console.log(body(), document.body.childNodes)
	expect(body()).toBe('a<p>loaded</p>')
})
*/
