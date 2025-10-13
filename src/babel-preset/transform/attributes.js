import {
	isNegativeNumber,
	isPlainTemplateLiteral,
	isNullUndefined,
	isBooleanFalse,
	isBooleanTrue,
	isConfident,
	isString,
	isNumber,
} from './literal.js'

/** Merges attributes into partial */
export function buildAttributeIntoTag(tag, name, value) {
	if (value.trim() === '') {
		tag.content += ' ' + name
		return
	}

	if (/"|'|=|<|>|`|\s/.test(value)) {
		tag.content += ' ' + name + "='" + escapeAttribute(value) + "'"
		return
	}

	tag.content += ' ' + name + '=' + value
}

/** If the attribute should be skipped */
export function shouldSkipAttribute(value) {
	if (value && value.expression) {
		return shouldSkipAttribute(value.expression)
	}

	return isNullUndefined(value) || isBooleanFalse(value)
}

/** If the attribute should be inlined */
export function isAttributeLiteral(value, attr) {
	if (value && value.expression) {
		return isAttributeLiteral(value.expression, attr)
	}

	return (
		isBooleanTrue(value) ||
		isString(value) ||
		isNumber(value) ||
		isConfident(attr)
	)
}

/** Get attribute literal value */
export function getAttributeLiteral(value, attr) {
	if (value && value.expression) {
		return getAttributeLiteral(value.expression, attr)
	}

	if (isBooleanTrue(value)) {
		return ''
	}

	if (isNegativeNumber(value)) {
		return '-' + value.argument.value
	}

	if (isPlainTemplateLiteral(value)) {
		return String(value.quasis[0].value.raw)
	}

	if (isString(value)) {
		return String(value.value)
	}

	if (isNumber(value)) {
		return String(value.value)
	}

	if (isConfident(attr)) {
		let r

		r = attr.get('value').get('expression').evaluate()
		if (r.confident) {
			return String(r.value)
		}

		r = attr.get('value').evaluate()
		if (r.confident) {
			return String(r.value)
		}

		r = attr.get('expression').evaluate()
		if (r.confident) {
			return String(r.value)
		}
	}

	return String(value.value)
}

/** Escapes `"` */
const escapeAttribute = (() => {
	const chars = {
		"'": '&#39;',
		'"': '&quot;',
	}

	const search = /['"]/g
	const replace = c => chars[c]

	return function (s) {
		return s.replace(search, replace)
	}
})()
