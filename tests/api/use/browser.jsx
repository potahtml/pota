/** @jsxImportSource pota */
// Tests for pota/use/browser: isMobile and isFirefox detection flags.

import { test } from '#test'

import { isFirefox, isMobile } from 'pota/use/browser'

await test('browser - exported flags match the current user agent checks', expect => {
	const userAgent = navigator.userAgent

	expect(isMobile).toBe(
		/mobile|iphone|ipod|ios|ipad|android/i.test(userAgent),
	)
	expect(isFirefox).toBe(/firefox/i.test(userAgent))
})

await test('browser - flags are boolean constants', expect => {
	expect(typeof isMobile).toBe('boolean')
	expect(typeof isFirefox).toBe('boolean')
})
