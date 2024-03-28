import { scrollToSelector } from './scrollToSelector.js'

/** Scrolls to `window.location.hash` */
export const scrollToLocationHash = () =>
	scrollToSelector(window.location.hash)
