import { isFunction } from '#std'

import { $reactive } from '#reactivity'

export const isReactive = value =>
	isFunction(value) && value[$reactive] === null
