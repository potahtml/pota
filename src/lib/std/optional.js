// an optional value is `true` by default, so most of the time is undefined which means is `true`
// to avoid having conditions like `if(something.bla === undefined || something.bla)`
// this function will short it to `if(optional(something.bla))`
// aditionally the value is resolved, for cases like `when={() => show() && optional(props.when)}`

import { getValue } from '#std'

export function optional(value) {
	return value === undefined || getValue(value)
}
