// an optional value is `true` by default, so most of the time is undefined which means is `true`
// to avoid having conditions like `if(something.bla === undefined || something.bla)`
// this function will short it to `if(optional(something.bla))`
// additionally the value is resolved, for cases like `when={() => show() && optional(props.when)}`

import { getValue } from './getValue.js'

/**
 * Returns true when value is true or undefined
 *
 * @param {Function | boolean | undefined} value
 * @returns {boolean} True when value is true or undefined
 */
export const optional = value =>
	value === undefined || getValue(value)
