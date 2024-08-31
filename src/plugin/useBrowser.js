import { navigator } from '../lib/std.js'

const userAgent =  navigator.userAgent

export const isMobile = /mobile|iphone|ipod|ios|ipad|android/i.test(
	userAgent,
)

export const isFirefox = /firefox/i.test(userAgent)
