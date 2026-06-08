import { navigator } from '../lib/std.js'

const userAgent = navigator.userAgent

/**
 * Detects whether the current browser user agent belongs to a mobile
 * device.
 *
 * @url https://pota.quack.uy/use/browser/isMobile
 */
export const isMobile = /mobile|iphone|ipod|ios|ipad|android/i.test(
	userAgent,
)

/**
 * Detects whether the current browser user agent belongs to Firefox.
 *
 * @url https://pota.quack.uy/use/browser/isFirefox
 */
export const isFirefox = /firefox/i.test(userAgent)

/**
 * Detects whether the current browser user agent belongs to macOS.
 *
 * @url https://pota.quack.uy/use/browser/isMac
 */
export const isMac = /mac/i.test(userAgent)
