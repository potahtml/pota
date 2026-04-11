/** @jsxImportSource pota */
// Tests for pota/use/location: location accessors, addListeners,
// navigate (relative, params, replace, delay), and navigateSync.

import { test, macrotask, sleepLong } from '#test'

import {
	addListeners,
	location,
	navigate,
	navigateSync,
} from 'pota/use/location'

const originalHref = window.location.href

async function restoreURL() {
	await sleepLong()

	history.replaceState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))

	await sleepLong()
}

await test('location - exported location accessors reflect the current url pieces', async expect => {
	expect(location.href()).toBe(window.location.href)
	expect(location.pathname()).toBe(window.location.pathname)
	expect(location.hash()).toBe(window.location.hash || '#')
	expect(location.path()).toBe(
		window.location.pathname + (window.location.hash || '#'),
	)
	expect(location.search()).toBe(window.location.search)
	expect(location.protocol).toBe(window.location.protocol)
	expect(location.origin).toBe(window.location.origin)
})

await test('location - addListeners keeps reactive location values in sync with history events', async expect => {
	addListeners()

	history.pushState(null, '', '/location-test?value=1#hash')
	window.dispatchEvent(new PopStateEvent('popstate'))

	await sleepLong()

	expect(location.pathname()).toBe('/location-test')
	expect(location.hash()).toBe('#hash')
	expect(location.search()).toBe('?value=1')
	expect(location.searchParams.value).toBe('1')

	await restoreURL()
})

await test('location - navigate resolves relative links, params and replace mode', async expect => {
	addListeners()

	navigate('navigate/:id?name=:name#done', {
		params: { id: '10', name: 'A B' },
		replace: true,
	})

	await sleepLong()

	expect(location.pathname()).toBe('/tests/api/use/navigate/10')
	expect(location.search()).toBe('?name=A%20B')
	expect(location.hash()).toBe('#done')

	await restoreURL()
})

await test('location - navigate supports delayed navigation', async expect => {
	addListeners()

	navigate('/delayed-test#hash', {
		delay: 100,
	})

	// before the delay elapses the navigation has not fired yet
	expect(location.pathname()).not.toBe('/delayed-test')

	await sleepLong()

	// after the delay it has
	expect(location.pathname()).toBe('/delayed-test')
	expect(location.hash()).toBe('#hash')

	await restoreURL()
})

await test('location - navigateSync updates location synchronously', async expect => {
	addListeners()

	navigateSync('/sync-test#anchor')

	expect(location.pathname()).toBe('/sync-test')
	expect(location.hash()).toBe('#anchor')

	await restoreURL()
})

await test('location - hash-only navigation updates hash signal', async expect => {
	addListeners()

	navigateSync('/hash-base')
	navigateSync('/hash-base#section')

	expect(location.hash()).toBe('#section')
	expect(location.pathname()).toBe('/hash-base')

	await restoreURL()
})

await test('location - searchParams reflects query string as mutable object', async expect => {
	addListeners()

	navigateSync('/search-test?a=1&b=2')

	expect(location.searchParams.a).toBe('1')
	expect(location.searchParams.b).toBe('2')

	await restoreURL()
})
