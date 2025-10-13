import { types as t } from '@babel/core'

// helpers

export function isNullUndefined(value) {
	return (
		t.isNullLiteral(value) || isUndefined(value) || isVoidZero(value)
	)
}

export function isString(value) {
	return t.isStringLiteral(value) || isPlainTemplateLiteral(value)
}

export function isNumber(value) {
	return (
		t.isNumericLiteral(value) ||
		isNegativeNumber(value) ||
		t.isBigIntLiteral(value)
	)
}

export function isBooleanFalse(value) {
	return t.isBooleanLiteral(value) && value.value === false
}
export function isBooleanTrue(value) {
	return t.isBooleanLiteral(value) && value.value === true
}

function isConfidentValue(path) {
	const r = path.evaluate()
	if (
		r.confident &&
		(typeof r.value === 'string' || typeof r.value === 'number')
	)
		return r
}

/**
 * Needs to try and catch because for `children` (not attributes)
 * crashes often when trying to evaluate `get('expression')`
 */
export function isConfident(path) {
	let r

	try {
		r = isConfidentValue(path.get('value').get('expression'))
		if (r) return r
	} catch (e) {}
	try {
		r = isConfidentValue(path.get('expression'))
		if (r) return r
	} catch (e) {}
	try {
		r = isConfidentValue(path.get('value'))
		if (r) return r
	} catch (e) {}
	try {
		r = isConfidentValue(path)
		if (r) return r
	} catch (e) {}

	return false
}

// native

export function isVoidZero(value) {
	return (
		t.isUnaryExpression(value, { operator: 'void' }) &&
		t.isNumericLiteral(value.argument, { value: 0 })
	)
}

export function isBoolean(value) {
	return t.isBooleanLiteral(value)
}

export function isUndefined(value) {
	return t.isIdentifier(value) && value.name === 'undefined'
}

export function isNegativeNumber(value) {
	return (
		t.isUnaryExpression(value, { operator: '-' }) &&
		t.isNumericLiteral(value.argument)
	)
}

export function isPlainTemplateLiteral(value) {
	return t.isTemplateLiteral(value) && value.expressions.length === 0
}
