import { isArray } from './isArray.js'

/**
 * Flats an array to the first children if the length is 1
 *
 * @param {any[]} arr
 * @returns {any}
 */
export const flat = arr =>
	isArray(arr) && arr.length === 1 ? arr[0] : arr
