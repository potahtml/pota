import { types as t } from '@babel/core'

import { buildChildren } from './children.js'

/** Builds children fragment */
export function buildFragment(path, state) {
	const children = buildChildren(path)

	if (children.length === 1) {
		return children[0]
	} else if (children.length > 1) {
		return t.arrayExpression(children)
	}
	return undefined
}
