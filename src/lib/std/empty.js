/**
 * Returns an object without a prototype
 *
 * @returns {Props} Empty object
 */
export const empty = Object.create.bind(null, null)
