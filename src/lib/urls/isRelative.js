import { isAbsolute } from './isAbsolute.js'

/**
 * Returns true if the link is relative
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link relative
 */
export const isRelative = url => !isAbsolute(url)
