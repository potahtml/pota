/**
 * Removes a value from an array
 *
 * @param {any[]} array
 * @param {any} value To remove from the array
 */
export function removeFromArray(array, value) {
	const index = array.indexOf(value)
	if (index !== -1) array.splice(index, 1)
}
