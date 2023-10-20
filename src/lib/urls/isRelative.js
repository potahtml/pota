import { isAbsolute } from '#urls'

/**
 * Returns true if the link is relative
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link relative
 */
export function isRelative(url) {
	return !isAbsolute(url)
}
