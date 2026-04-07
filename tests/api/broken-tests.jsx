/*
await test('A - clicking navigates to the target route', async expect => {
	await reset()
	console.log(window.location.href)

	const dispose = render(
		<>
			<Route path="/start">
				<A href="/end">go</A>
			</Route>
			<Route path="/end">end page</Route>
		</>,
	)
	goto('/start')
	await tick()
	await tick()
	expect(body()).toBe('<a href="/end">go</a>')
	expect(
		document.querySelector('a') instanceof HTMLAnchorElement,
	).toBe(true)
	console.log(document.querySelector('a'))
	await tick()
	console.log(document.querySelector('a').click)
	document.querySelector('a').click()

	await tick()
	await tick()
	console.log(body())
	await new Promise(resolve => {
		setTimeout(() => {
			expect(body()).toBe('end page')
			dispose()
			resolve()
			console.log('wth lol')
		}, 20)
	})
})

await test('owned - does not run callback after owner is disposed', expect => {
	const seen = []

	let fn
	const dispose = root(d => {
		fn = owned(value => seen.push(value))
		return d
	})

	fn('before')
	dispose()
	fn('after')

	expect(seen).toEqual(['before'])
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
