import { isFunction } from '#std'

import { $class } from '#comp'

export const isClassComponent = value =>
	isFunction(value) && value[$class] === null
