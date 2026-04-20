/** @jsxImportSource pota */

// Tests for the `Navigate` component — declarative redirect on
// render, child rendering during redirect, replaceState option.

import { test, body, microtask, macrotask, sleepLong } from '#test'

import { render } from 'pota'
import { Navigate, Route } from 'pota/components'
import { addListeners, navigateSync } from 'pota/use/location'

// disable view transitions in tests to avoid AbortError
document.startViewTransition = undefined

function goto(path) {
	const url = path.startsWith('http')
		? path
		: `${window.location.origin}${path}`
	navigateSync(url, { replace: true })
}

async function reset() {
	addListeners()
	goto('/')
	await microtask()
	document.body.innerHTML = ''
}

await test('Navigate - redirects to target path on render', async expect => {
	await reset()
	const origin = window.location.origin
	const dispose = render(
		<>
			<Route path="/redirect$">
				<Navigate path={`${origin}/target`} />
			</Route>
			<Route path="/target$">target page</Route>
		</>,
	)
	goto('/redirect')
	await macrotask()
	expect(body()).toBe('target page')
	dispose()
})

await test('Navigate - renders its children while redirecting', async expect => {
	await reset()
	const origin = window.location.origin
	const dispose = render(
		<Route path="/redirect$">
			<Navigate path={`${origin}/elsewhere`}>Redirecting...</Navigate>
		</Route>,
	)
	goto('/redirect')
	await macrotask()
	expect(window.location.pathname).toBe('/elsewhere')
	dispose()
})

await test('Navigate - replace option uses replaceState', async expect => {
	await reset()
	const before = history.length

	// baseline: history has a known length before navigate
	expect(before > 0).toBe(true)

	const dispose = render(
		<Navigate path="/nav-replace" replace>
			redirected
		</Navigate>,
	)

	await sleepLong()

	expect(body()).toInclude('redirected')
	// history.length should not increase with replace
	expect(history.length).toBe(before)

	dispose()
})
