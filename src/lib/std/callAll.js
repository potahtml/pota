/**
 * Calls an array of functions
 *
 * @param {Function[]} fns
 */
export const callAll = fns => {
	for (const fn of fns) fn()
}
