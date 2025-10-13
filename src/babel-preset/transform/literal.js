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

export function isConfident(path) {
	return (
		path.get('value').get('expression').evaluate().confident ||
		path.get('expression').evaluate().confident ||
		path.get('value').evaluate().confident ||
		path.evaluate().confident
	)
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
