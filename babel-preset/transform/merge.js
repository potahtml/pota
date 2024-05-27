import { getChildrenLiteral, isChildrenLiteral } from './children.js'
import { getPartialLiteral, isPartialHTML } from './partial.js'

/** Merges text/partial childrens to parent */
export function mergeToTag(children, tag) {
	const toRemove = []

	for (let i = 0; i < children.length; i++) {
		const node = children[i]
		if (isChildrenLiteral(node)) {
			tag.content += getChildrenLiteral(node)

			toRemove.push(node)
			continue
		}
		if (isPartialHTML(node)) {
			tag.content += getPartialLiteral(node)

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

/** Merges all sibling text/partial childrens */
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
			if (isPartialHTML(next)) {
				next.arguments[0].value =
					getChildrenLiteral(node) + getPartialLiteral(next)

				toRemove.push(node)
				node = next
				next = children[++i]
				continue
			}
		}

		if (isPartialHTML(node)) {
			if (isChildrenLiteral(next)) {
				node.arguments[0].value += getChildrenLiteral(next)

				toRemove.push(next)
				next = children[++i]
				continue
			}
			if (isPartialHTML(next)) {
				node.arguments[0].value += getPartialLiteral(next)

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
