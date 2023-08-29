export const getValue = value =>
	typeof value === 'function' ? getValue(value()) : value
