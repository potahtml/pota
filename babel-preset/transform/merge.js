import { getChildrenLiteral, isChildrenLiteral } from './children.js'

import { getHTMLTemplate, isHTMLTemplate } from './template.js'

// attributes

export function mergeAttributeToTag(tag, name, value) {
	if (value.trim() === '') {
		tag.content += ' ' + name
		return
	}

	if (/"|'|=|<|>|`|\s/.test(value)) {
		tag.content += ' ' + name + '="' + value + '"'
		return
	}

	tag.content += ' ' + name + '=' + value
}

// children

export function mergeChildrenToTag(children, tag) {
	/**
	 * ```js
	 * Component('a', { children: ['1', '2'] })
	 *
	 * into`<a>12`
	 * ```
	 */

	const toRemove = []

	for (let i = 0; i < children.length; i++) {
		const node = children[i]
		if (isChildrenLiteral(node)) {
			tag.content += getChildrenLiteral(node)
			toRemove.push(node)
			continue
		}
		if (isHTMLTemplate(node)) {
			tag.content += getHTMLTemplate(node)
			tag.children.push(node.arguments[1])
			toRemove.push(node)
			continue
		}
		break
	}

	return children.filter(child => !toRemove.includes(child))
}

export function mergeText(children) {
	/**
	 * ```js
	 * ;['1', '2']
	 *
	 * into
	 * ;['12']
	 * ```
	 */
	const toRemove = []
	for (let i = 0; i < children.length; i++) {
		const node = children[i]
		if (isChildrenLiteral(node)) {
			let nextSibling = children[++i]
			while (nextSibling && isChildrenLiteral(nextSibling)) {
				node.value += getChildrenLiteral(nextSibling)
				toRemove.push(nextSibling)
				nextSibling = children[++i]
			}
		}
	}
	return children.filter(child => !toRemove.includes(child))
}
export function mergeTemplates(children) {
	/**
	 * ```js
	 * template('1'), '2', template('3')
	 *
	 * into
	 *
	 * template('123')
	 * ```
	 */
	const toRemove = []
	for (let i = 0; i < children.length; i++) {
		const node = children[i]
		if (isHTMLTemplate(node)) {
			let nextSibling = children[++i]
			while (nextSibling) {
				if (isHTMLTemplate(nextSibling)) {
					node.arguments[0].value += getHTMLTemplate(nextSibling)

					// push to siblings
					node.arguments[1].properties[1].value.elements.push(
						nextSibling.arguments[1],
					)
					toRemove.push(nextSibling)
					nextSibling = children[++i]
				} else if (isChildrenLiteral(nextSibling)) {
					node.arguments[0].value += getChildrenLiteral(nextSibling)

					toRemove.push(nextSibling)
					nextSibling = children[++i]
				} else {
					break
				}
			}
		}
	}
	return children.filter(child => !toRemove.includes(child))
}
export function mergeTextToTemplate(children) {
	/**
	 * ```js
	 * ;['1', template('2')]
	 *
	 * into
	 *
	 * template('12')
	 * ```
	 */
	const toRemove = []
	for (let i = 0; i < children.length; i++) {
		const node = children[i]
		let nextSibling = children[++i]
		if (
			isChildrenLiteral(node) &&
			nextSibling &&
			isHTMLTemplate(nextSibling)
		) {
			nextSibling.arguments[0].value =
				getChildrenLiteral(node) + getHTMLTemplate(nextSibling)
			toRemove.push(node)
		}
	}
	return children.filter(child => !toRemove.includes(child))
}
