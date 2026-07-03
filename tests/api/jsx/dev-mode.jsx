/** @jsxImportSource pota */
// Dev-mode flag: component props are NOT frozen by default (the
// production default); importing `pota/dev` turns dev guards on.
// This file runs in its own browser page, so enabling dev here
// cannot leak into other test files — and test order within the
// file matters (default-off asserted before the dev import).

import { test, body } from '#test'
import { render } from 'pota'

await test('component props are not frozen by default', expect => {
	let frozen = null
	const Comp = props => {
		frozen = Object.isFrozen(props)
		return props.a
	}

	const dispose = render(<Comp a="x" />)
	expect(frozen).toBe(false)
	expect(body()).toBe('x')

	dispose()
})

await test('importing pota/dev enables prop freezing', async expect => {
	await import('pota/dev')

	let frozen = null
	const Comp = props => {
		frozen = Object.isFrozen(props)
		return props.a
	}

	const dispose = render(<Comp a="y" />)
	expect(frozen).toBe(true)
	expect(body()).toBe('y')

	dispose()
})
