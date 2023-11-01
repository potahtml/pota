/**
 * Returns true if the link is absolute: starts with '/', '#' or
 * 'http'
 *
 * @param {string} href - Url
 * @returns {boolean} Returns true if the link is absolute
 */
export const isAbsolute = href =>
	href[0] === '/' || href[0] === '#' || /^http/.test(href)
