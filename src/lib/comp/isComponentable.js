import { isArray, isFunction, isNotNullObject } from '#std'
import { isReactive } from '#reactivity'

export const isComponentable = value =>
	!isReactive(value) &&
	(isFunction(value) ||
		// avoid [1,2] and support { toString(){ return "something"} }
		(!isArray(value) && isNotNullObject(value)))
