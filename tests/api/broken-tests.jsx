/*
await test('fullscreen - emitter and jsx plugin react to fullscreen changes', async expect => {
	const target = document.createElement('div')
	target.textContent = 'click me to fullscreen'
	document.body.append(target)

	const seen = []
	await root(async disposeOwner => {
		const value = useFullscreen()
		onFullscreen(next => {
			console.log('next', next)
			seen.push(next)
		})

		const disposeNode = render(
			<button use:fullscreen={() => target}>Open</button>,
		)

		await microtask()

		$('button').click()

		await microtask()
		await macrotask()

		console.log(value()) // alue is null for whatever reason

		expect(value()).toBe(target)
		expect(seen.at(-1)).toBe(target)

		//disposeNode()
		//disposeOwner()
	})
})
*/
