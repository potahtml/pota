/** @jsxImportSource pota */
// Tests for pota/use/location canNavigate branches and the
// onLocationChange reject path. Isolated from location.jsx so each
// test file gets a fresh tab and a clean BeforeLeave registry.

import { test, sleepLong } from '#test'

import {
	addListeners,
	location,
	navigate,
	navigateSync,
	useBeforeLeave,
} from 'pota/use/location'

// disable view transitions in tests to avoid AbortError
document.startViewTransition = undefined

const originalHref = window.location.href

async function restoreURL() {
	await sleepLong()
	history.replaceState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))
	await sleepLong()
}

// Register useBeforeLeave at the current URL, then navigate to a
// full URL whose href starts with the registered prefix. canNavigate
// takes the prefix-match branch and keeps the entry alive (cb is
// NOT called). A subsequent non-prefix navigation proves the entry
// survived by invoking the callback once.

await test('canNavigate - prefix match keeps useBeforeLeave entry without calling cb', async expect => {
	addListeners()

	const origin = window.location.origin
	navigateSync('/prefix-base')
	await sleepLong()

	let calls = 0
	useBeforeLeave(() => {
		calls++
		return true
	})

	await navigate(origin + '/prefix-base/sub')
	await sleepLong()
	expect(calls).toBe(0)

	await navigate(origin + '/prefix-elsewhere')
	await sleepLong()
	expect(calls).toBe(1)

	await navigate(origin + '/prefix-elsewhere-again')
	await sleepLong()
	expect(calls).toBe(1)

	await restoreURL()
})

// Dispatching popstate while a useBeforeLeave callback returns false
// exercises the else-branch of onLocationChange that calls
// history.pushState(null, '', location.href()) to restore the URL.

await test('onLocationChange - popstate + rejecting useBeforeLeave restores URL', async expect => {
	addListeners()

	navigateSync('/reject-base')
	await sleepLong()
	const baseHref = location.href()

	let rejectOnce = true
	useBeforeLeave(() => {
		if (rejectOnce) {
			rejectOnce = false
			return false
		}
		return true
	})

	history.pushState(null, '', '/reject-target')
	window.dispatchEvent(new PopStateEvent('popstate'))
	await sleepLong()

	expect(location.href()).toBe(baseHref)

	await restoreURL()
})
