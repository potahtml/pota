import { isFunction } from '#std'

import { $component } from '#comp'

export const isComponent = value =>
	isFunction(value) && value[$component] === null
