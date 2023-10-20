import { origin } from '#urls'

/**
 * Returns true if the link is external. It does so by checking that
 * window.location.origin is present at the beginning of the url
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link is external
 */
export function isExternal(url) {
	return /^http/.test(url) && (url + '/').indexOf(origin + '/') !== 0
}
