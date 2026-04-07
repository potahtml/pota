/** @jsxImportSource pota */

import { test } from '#test'

await test('polyfills - module can be imported for side effects', async expect => {
	const mod = await import('pota/use/polyfills')

	expect(Object.keys(mod).length).toBe(0)
})
