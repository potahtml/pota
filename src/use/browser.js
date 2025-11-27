import { navigator } from '../lib/std.js'

const userAgent = navigator.userAgent

/**
 * Detects whether the current browser user agent belongs to a mobile
 * device.
 */
export const isMobile = /mobile|iphone|ipod|ios|ipad|android/i.test(
	userAgent,
)

/** Detects whether the current browser user agent belongs to Firefox. */
export const isFirefox = /firefox/i.test(userAgent)
