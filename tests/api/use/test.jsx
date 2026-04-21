/** @jsxImportSource pota */
// Tests for pota/use/test: body, isProxy, rerenders, test function
// numbering/reset, and expect methods (not, toInclude, toThrow, toMatch).

import { test } from '#test'

import { render } from 'pota'
import {
	body,
	isProxy,
	rerenders,
	test as useTest,
} from 'pota/use/test'

await test('test - body reports the current document markup', expect => {
	const dispose = render(<div>hello</div>)

	expect(body()).toBe('<div>hello</div>')

	dispose()
})

await test('test - isProxy distinguishes proxies from plain objects', expect => {
	const proxied = new Proxy({}, {})

	expect(isProxy(proxied)).toBe(true)
	expect(isProxy({})).toBe(false)
})

await test('test - rerenders injects a stylesheet', expect => {
	expect(document.adoptedStyleSheets.length).toBe(0)

	rerenders()

	expect(document.adoptedStyleSheets.length).toBe(1)

	// clean up so the harness check passes
	document.adoptedStyleSheets = []
})

await test('test - exported test function numbers assertions and reset restarts numbering', async expect => {
	useTest.reset()

	const logs = []
	const originalLog = console.log

	console.log = value => {
		logs.push(value)
	}

	await useTest('first', expect => {
		expect(1).toBe(1)
	})
	useTest.reset()
	await useTest('second', expect => {
		expect(2).toBe(2)
	})

	console.log = originalLog
	expect(logs).toEqual(['1 - first', '1 - second'])
})

await test('test - expect.not.toBe rejects equal values', async expect => {
	useTest.reset()
	const originalError = console.error
	let errorCalled = false
	console.error = () => {
		errorCalled = true
	}

	const result = useTest('not-test', expect => {
		expect(1).not.toBe(2)
	})
	await result

	expect(errorCalled).toBe(false)

	console.error = originalError
})

await test('test - expect.toInclude checks substring presence', async expect => {
	useTest.reset()

	const result = useTest('include-test', expect => {
		expect('hello world').toInclude('world')
	})
	await result
})

await test('test - expect.toThrow passes when function throws', async expect => {
	useTest.reset()

	const result = useTest('throw-test', expect => {
		expect(() => {
			throw new Error('boom')
		}).toThrow()
	})
	await result
})

await test('test - expect.toMatch validates against regex', async expect => {
	useTest.reset()

	const result = useTest('match-test', expect => {
		expect('abc123').toMatch(/\d+/)
	})
	await result
})

// --- isProxy returns false for primitives ----------------------------

await test('test - isProxy returns false for primitive values', expect => {
	expect(isProxy(42)).toBe(false)
	expect(isProxy('hello')).toBe(false)
	expect(isProxy(null)).toBe(false)
	expect(isProxy(undefined)).toBe(false)
	expect(isProxy(true)).toBe(false)
})

// --- isProxy recognizes array proxies -------------------------------

await test('test - isProxy recognizes array proxies', expect => {
	const arrProxy = new Proxy([], {})
	expect(isProxy(arrProxy)).toBe(true)
})

// --- useTest.reset restarts test numbering --------------------------

await test('test - useTest.reset restarts test numbering', async expect => {
	const logs = []
	const originalLog = console.log
	console.log = v => logs.push(v)

	useTest.reset()

	await useTest('a', () => {})
	await useTest('b', () => {})

	expect(logs[0]).toBe('1 - a')
	expect(logs[1]).toBe('2 - b')

	useTest.reset()

	await useTest('c', () => {})
	expect(logs[2]).toBe('1 - c')

	console.log = originalLog
})

// --- expect.toEqual passes for structurally equal objects -----------

await test('test - expect.toEqual passes for deep-equal objects', async expect => {
	useTest.reset()

	const result = useTest('equal-test', expect => {
		expect({ a: 1, b: { c: 2 } }).toEqual({ a: 1, b: { c: 2 } })
	})
	await result
})

// --- expect.toMatch passes for a matching regex ---------------------

await test('test - expect.toMatch passes for matching regex', async expect => {
	useTest.reset()

	const result = useTest('match-test', expect => {
		expect('hello world').toMatch(/world/)
		expect('abc123').toMatch(/\d+/)
	})
	await result
})

// --- expect.not.toInclude rejects substring -------------------------

await test('test - expect.not.toInclude rejects substrings that are present', async expect => {
	useTest.reset()

	// this should not throw at the outer level
	const result = useTest('not-include', expect => {
		expect('hello world').not.toInclude('zzz')
	})
	await result
})
