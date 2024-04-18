import { getChildrenLiteral, isChildrenLiteral } from './children.js'
import { getHTMLTemplate, isHTMLTemplate } from './template.js'

export function mergeToTag(children, tag) {
	/**
	 * ```js
	 * Component('a', {
	 * 	children: ['1', '2', template('3')],
	 * })
	 *
	 * into
	 * // `<a>123`
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

			if (node.arguments[1].elements.length) {
				tag.props.push(...node.arguments[1].elements)
			}

			toRemove.push(node)
			continue
		}
		break
	}

	return children.filter(child => !toRemove.includes(child))
}

export function merge(children) {
	const toRemove = []

	let i = 0
	let node = children[i]
	let next = children[++i]

	while (node && next) {
		if (isChildrenLiteral(node)) {
			if (isChildrenLiteral(next)) {
				node.value += getChildrenLiteral(next)

				toRemove.push(next)
				next = children[++i]
				continue
			}
			if (isHTMLTemplate(next)) {
				next.arguments[0].value =
					getChildrenLiteral(node) + getHTMLTemplate(next)

				toRemove.push(node)
				node = next
				next = children[++i]
				continue
			}
		}

		if (isHTMLTemplate(node)) {
			if (isChildrenLiteral(next)) {
				node.arguments[0].value += getChildrenLiteral(next)

				toRemove.push(next)
				next = children[++i]
				continue
			}
			if (isHTMLTemplate(next)) {
				node.arguments[0].value += getHTMLTemplate(next)

				if (next.arguments[1].elements.length) {
					node.arguments[1].elements.push(
						...next.arguments[1].elements,
					)
				}

				toRemove.push(next)
				next = children[++i]
				continue
			}
		}

		node = next
		next = children[++i]
	}
	return children.filter(child => !toRemove.includes(child))
}
