import { origin } from './origin.js'

/**
 * Returns true if the link is external. It does so by checking that
 * window.location.origin is present at the beginning of the url
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link is external
 */
export const isExternal = url =>
	// origin could be http://example.net and link could be http://example.net.ha.com, so add "/"
	/^http/.test(url) && !(url + '/').startsWith(origin + '/')
