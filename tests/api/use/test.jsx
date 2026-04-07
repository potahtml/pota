/** @jsxImportSource pota */

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
	const before = document.adoptedStyleSheets.length

	rerenders()

	expect(document.adoptedStyleSheets.length).toBe(before + 1)
})

await test('test - exported test function numbers assertions and reset restarts numbering', async expect => {
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
