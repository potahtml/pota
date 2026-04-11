import { types as t } from '@babel/core'

import {
	isConfident,
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
	return merge(buildChildrenPartial(path))
}

export function buildChildrenPartial(path) {
	return path
		.get('children')
		.map((x, i) => {
			let child = path.node.children[i]

			if (t.isJSXText(child)) {
				return cleanJSXElementLiteralChild(child)
			}
			if (t.isJSXExpressionContainer(child)) {
				child = child.expression
			}
			if (t.isJSXEmptyExpression(child)) {
				return null
			}

			const r = isConfident(x)
			if (r) {
				return t.stringLiteral(String(r.value))
			}
			return child
		})
		.filter(x => x !== null)
}
function cleanJSXElementLiteralChild(child) {
	const lines = child.value.split(/\r\n|\n|\r/)
	let lastNonEmptyLine = 0
	for (let i = 0; i < lines.length; i++) {
		if (/[^ \t]/.exec(lines[i])) {
			lastNonEmptyLine = i
		}
	}
	let str = ''
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const isFirstLine = i === 0
		const isLastLine = i === lines.length - 1
		const isLastNonEmptyLine = i === lastNonEmptyLine
		let trimmedLine = line.replace(/\t/g, ' ')
		if (!isFirstLine) {
			trimmedLine = trimmedLine.replace(/^ +/, '')
		}
		if (!isLastLine) {
			trimmedLine = trimmedLine.replace(/ +$/, '')
		}
		if (trimmedLine) {
			if (!isLastNonEmptyLine) {
				trimmedLine += ' '
			}
			str += trimmedLine
		}
	}
	return str ? t.inherits(t.stringLiteral(str), child) : null
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
