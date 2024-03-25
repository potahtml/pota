import { Object } from './Object.js'

/**
 * Returns an object without a prototype
 *
 * @type {Function}
 * @returns {Props} Empty object
 */
export const empty = Object.create.bind(null, null)
