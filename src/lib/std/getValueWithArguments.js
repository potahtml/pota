import { getValue } from './getValue.js'

export const getValueWithArguments = (value, ...args) =>
	typeof value === 'function'
		? args.length
			? getValue(value(...args))
			: getValue(value())
		: value
