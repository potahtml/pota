import { types as t } from '@babel/core'

import {
	isVoidZero,
	isUndefined,
	isNegativeNumber,
	isPlainTemplateLiteral,
	isString,
	isNumber,
	isBoolean,
	isNullUndefined,
} from './literal.js'

import { escapeHTML } from './html.js'
import { merge } from './merge.js'

/** Builds and merge children */
export function buildChildren(path) {
	return merge(t.react.buildChildren(path.node))
}

/** If children is string or number */
export function isChildrenLiteral(value) {
	if (value && value.expression) {
		return isChildrenLiteral(value.expression)
	}

	return (
		isString(value) ||
		isNumber(value) ||
		isBoolean(value) ||
		isNullUndefined(value)
	)
}

/** Gets children string or number */
export function getChildrenLiteral(value) {
	if (value && value.expression) {
		return getChildrenLiteral(value.expression)
	}

	if (isNegativeNumber(value)) {
		return '-' + value.argument.value
	}

	if (isPlainTemplateLiteral(value)) {
		return escapeHTML(value.quasis[0].value.raw)
	}

	if (isNullUndefined(value)) {
		return ''
	}
	return escapeHTML(value.value)
}
