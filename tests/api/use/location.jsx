/** @jsxImportSource pota */

import { test } from '#test'

import { location, addListeners, navigate } from 'pota/use/location'

async function tick() {
	await new Promise(r => setTimeout(r, 0))
}

await test('location - exported location accessors reflect the current url pieces', expect => {
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
	const originalHref = window.location.href

	addListeners()
	history.pushState(null, '', '/location-test?value=1#hash')
	window.dispatchEvent(new PopStateEvent('popstate'))

	await new Promise(resolve => setTimeout(resolve, 0))

	expect(location.pathname()).toBe('/location-test')
	expect(location.hash()).toBe('#hash')
	expect(location.search()).toBe('?value=1')
	expect(location.searchParams.value).toBe('1')

	history.pushState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))
})

await test('location - navigate resolves relative links, params and replace mode', async expect => {
	const originalHref = window.location.href

	addListeners()
	navigate('navigate/:id?name=:name#done', {
		params: { id: '10', name: 'A B' },
		replace: true,
	})

	await new Promise(resolve => setTimeout(resolve, 0))
	await new Promise(resolve => setTimeout(resolve, 10))

	expect(location.pathname()).toBe('/navigate/10')
	expect(location.search()).toBe('?name=A%20B')
	expect(location.hash()).toBe('#done')

	history.pushState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))
})

await test('location - navigate supports delayed navigation', async expect => {
	const originalHref = window.location.href

	addListeners()
	navigate('/delayed-test#hash', {
		delay: 5,
	})

	expect(location.pathname()).not.toBe('/delayed-test')

	await new Promise(resolve => setTimeout(resolve, 20))

	expect(location.pathname()).toBe('/delayed-test')
	expect(location.hash()).toBe('#hash')

	history.pushState(null, '', originalHref)
	window.dispatchEvent(new PopStateEvent('popstate'))
})
