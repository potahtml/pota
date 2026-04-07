/** @jsxImportSource pota */

import { test } from '#test'

import { isFirefox, isMobile } from 'pota/use/browser'

await test('browser - exported flags match the current user agent checks', expect => {
	const userAgent = navigator.userAgent

	expect(isMobile).toBe(
		/mobile|iphone|ipod|ios|ipad|android/i.test(userAgent),
	)
	expect(isFirefox).toBe(/firefox/i.test(userAgent))
})
