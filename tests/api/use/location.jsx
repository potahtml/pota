/** @jsxImportSource pota */

import { test, macrotask, microtask, sleep } from '#test'

import { location, addListeners, navigate } from 'pota/use/location'

const originalHref = window.location.href

async function restoreURL() {
	history.replaceState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))
	await macrotask()
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

	await macrotask()

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

	await sleep(50)

	expect(location.pathname()).toBe('/tests/api/use/navigate/10')
	expect(location.search()).toBe('?name=A%20B')
	expect(location.hash()).toBe('#done')

	await restoreURL()
})

await test('location - navigate supports delayed navigation', async expect => {
	addListeners()

	navigate('/delayed-test#hash', {
		delay: 50,
	})

	expect(location.pathname()).not.toBe('/delayed-test')

	await sleep(150)

	expect(location.pathname()).toBe('/delayed-test')
	expect(location.hash()).toBe('#hash')

	await restoreURL()
})
