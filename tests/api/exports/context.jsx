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

await test('context - walk with empty chain returns false', expect => {
	const Ctx = context({ name: 'root', parent: undefined })

	const visited = []
	const stopped = Ctx.walk(value => {
		visited.push(value.name)
		return false
	})

	expect(stopped).toBe(false)
	expect(visited).toEqual(['root'])
})

await test('context - multiple Providers at the same level are independent', expect => {
	const A = context('a-default')
	const B = context('b-default')

	const dispose = render(
		<A.Provider value="a-val">
			<B.Provider value="b-val">
				<p>
					{A()}-{B()}
				</p>
			</B.Provider>
		</A.Provider>,
	)

	expect(body()).toBe('<p>a-val-b-val</p>')

	dispose()
})

// --- context with no default value ------------------------------------

await test('context - reading with no explicit default returns undefined', expect => {
	const Ctx = context()

	expect(Ctx()).toBe(undefined)
})

// --- context with null as default -------------------------------------

await test('context - null as default value is returned as-is', expect => {
	const Ctx = context(null)

	expect(Ctx()).toBe(null)
})

// --- context value propagates through nested components --------------

await test('context - value propagates through intermediate components', expect => {
	const Theme = context('light')

	function Middle(props) {
		return <section>{props.children}</section>
	}

	function Deep() {
		return <p>theme:{Theme()}</p>
	}

	const dispose = render(
		<Theme.Provider value="dark">
			<Middle>
				<Middle>
					<Deep />
				</Middle>
			</Middle>
		</Theme.Provider>,
	)

	expect(body()).toBe(
		'<section><section><p>theme:dark</p></section></section>',
	)

	dispose()
})

// --- context reads return the outer value after inner Provider disposes -

await test('context - functional override restores the outer value immediately after returning', expect => {
	const Ctx = context('outer')
	const snapshots = []

	Ctx('inner', () => {
		snapshots.push(Ctx())
	})

	snapshots.push(Ctx())

	expect(snapshots).toEqual(['inner', 'outer'])
})

// --- context value of 0 (a falsy value) is preserved as default --------

await test('context - zero as default value is not coerced to undefined', expect => {
	const Ctx = context(0)

	expect(Ctx()).toBe(0)
})

// --- context Provider with a function as value -------------------------

await test('context - Provider value can be a function and consumers call it', expect => {
	const Ctx = context(() => 'default-fn')

	const dispose = render(
		<Ctx.Provider value={() => 'override-fn'}>
			<p>{() => Ctx()()}</p>
		</Ctx.Provider>,
	)

	expect(body()).toBe('<p>override-fn</p>')

	dispose()
})

// --- context reading back the complete object value ------------------

await test('context - object value is preserved by reference through the provider', expect => {
	const theme = { name: 'dark', shade: 9 }
	const Ctx = context({ name: 'light', shade: 1 })

	Ctx(theme, () => {
		expect(Ctx()).toBe(theme)
		expect(Ctx().name).toBe('dark')
	})
})
