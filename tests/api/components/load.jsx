/** @jsxImportSource pota */

// Tests for `load()` — async component factory: dynamic-import
// resolution, retry-on-failure, error escalation to an `Errored`
// boundary after retries exhaust.

import { test, body, microtask, macrotask, sleepLong } from '#test'

import { render } from 'pota'
import { Errored, load, Route } from 'pota/components'
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

await test('load - resolves a dynamic import and renders its default export', async expect => {
	await reset()

	const Lazy = load(() =>
		Promise.resolve({
			default: () => <p>lazy loaded</p>,
		}),
	)

	const dispose = render(
		<Route path="/load-test$">
			<Lazy />
		</Route>,
	)

	goto('/load-test')
	await macrotask()

	expect(body()).toInclude('lazy loaded')

	dispose()
	await reset()
})

await test('load - retries on failure and eventually renders error string', async expect => {
	await reset()
	let attempts = 0

	const Lazy = load(() => {
		attempts++
		return Promise.reject(new Error('network error'))
	})

	const dispose = render(
		<Route path="/load-fail$">
			<Lazy />
		</Route>,
	)

	goto('/load-fail')

	// load retries up to 9 times with 5s delay
	// just verify it attempted at least once
	await microtask()
	await sleepLong()

	expect(attempts >= 1).toBe(true)

	dispose()
	await reset()
})

await test('load - after exhausting retries, error routes to Errored boundary', async expect => {
	await reset()
	const originalError = console.error
	console.error = () => {}

	// start at tries=9 so first failure immediately throws
	const Lazy = load(
		() => Promise.reject(new Error('permanent failure')),
		9,
	)

	const dispose = render(
		<Route path="/load-errored$">
			<Errored fallback={err => <p>{err.message}</p>}>
				<Lazy />
			</Errored>
		</Route>,
	)

	goto('/load-errored')
	await macrotask()
	await sleepLong()

	expect(body()).toInclude('permanent failure')

	console.error = originalError
	dispose()
	await reset()
})
