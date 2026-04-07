/** @jsxImportSource pota */

// Tests for the context API: default values, direct overrides,
// Provider JSX component, nested providers, and walk traversal.
import { body, test } from '#test'

import { context, render, signal } from 'pota'

await test('context - returns the default value when no provider or override is active', expect => {
	const Theme = context('light')

	expect(Theme()).toBe('light')
})

await test('context - direct overrides can be nested and restore the outer value', expect => {
	const Theme = context('light')

	expect(
		Theme('dark', () =>
			Theme('contrast', () => [
				Theme(),
				Theme('warm', () => Theme()),
			]),
		),
	).toEqual(['contrast', 'warm'])

	expect(Theme('dark', () => Theme())).toBe('dark')
	expect(Theme()).toBe('light')
})

await test('context - Provider makes the value available to rendered children', expect => {
	const Theme = context('light')
	const dispose = render(
		<Theme.Provider value="dark">
			<p>{Theme()}</p>
		</Theme.Provider>,
	)

	expect(body()).toBe('<p>dark</p>')

	dispose()
})

await test('context - nested Providers override inner children only', expect => {
	const Theme = context('light')
	const dispose = render(
		<Theme.Provider value="outer">
			<p>{Theme()}</p>
			<Theme.Provider value="inner">
				<p>{Theme()}</p>
			</Theme.Provider>
			<p>{Theme()}</p>
		</Theme.Provider>,
	)

	expect(body()).toBe('<p>outer</p><p>inner</p><p>outer</p>')

	dispose()
})

await test('context - walk follows the parent chain and stops when callback returns true', expect => {
	const RouteContext = context({
		name: 'default',
		parent: undefined,
	})

	const visited = []
	const stopped = RouteContext.walk(
		value => {
			visited.push(value.name)
			return value.name === 'middle'
		},
		{
			name: 'leaf',
			parent: {
				name: 'middle',
				parent: {
					name: 'root',
					parent: undefined,
				},
			},
		},
	)

	expect(stopped).toBe(true)
	expect(visited).toEqual(['leaf', 'middle'])
})

await test('context - walk uses the current context value when no explicit context is passed', expect => {
	const RouteContext = context({
		name: 'default',
		parent: undefined,
	})
	const visited = []

	const dispose = render(
		<RouteContext.Provider
			value={{
				name: 'leaf',
				parent: {
					name: 'root',
					parent: undefined,
				},
			}}
		>
			<p>
				{String(
					RouteContext.walk(value => {
						visited.push(value.name)
					}),
				)}
			</p>
		</RouteContext.Provider>,
	)

	expect(body()).toBe('<p>false</p>')
	expect(visited).toEqual(['leaf', 'root'])

	dispose()
})

await test('context - functional override returns result and restores value after scope', expect => {
	const Ctx = context({ myValue: 1 })

	expect(Ctx().myValue).toBe(1)

	const result = Ctx({ myValue: 2 }, () => {
		expect(Ctx().myValue).toBe(2)
		// nested override inside the callback
		Ctx({ myValue: 3 }, () => {
			expect(Ctx().myValue).toBe(3)
		})
		// restored after nested scope exits
		expect(Ctx().myValue).toBe(2)
		return 'done'
	})

	expect(result).toBe('done')
	expect(Ctx().myValue).toBe(1)
})

await test('context - Provider with reactive signal value updates consumers', expect => {
	const Ctx = context({ count: 0 })
	const count = signal(1)

	function Consumer() {
		return <p>{() => Ctx().count}</p>
	}

	const dispose = render(
		<Ctx.Provider value={{ count: count.read }}>
			<Consumer />
		</Ctx.Provider>,
	)

	expect(body()).toBe('<p>1</p>')

	count.write(5)

	expect(body()).toBe('<p>5</p>')

	dispose()
})
