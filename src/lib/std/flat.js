/**
 * Flats an array/childNodes to the first children if the length is 1
 *
 * @param {any[] | NodeListOf<ChildNode>} arr
 * @returns {any}
 */
export const flat = arr => (arr.length === 1 ? arr[0] : arr)
