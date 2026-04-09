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
