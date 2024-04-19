import { types as t } from '@babel/core'

import { call, get } from './utils.js'

import { merge } from './merge.js'
import { buildPropChildren } from './props.js'

export function buildJSXFragment(path, state) {
	const args = [get(state, 'id/fragment')()]

	const children = merge(t.react.buildChildren(path.node))

	args.push(
		t.objectExpression(
			children.length > 0 ? [buildPropChildren(children)] : [],
		),
	)

	return call(state, 'jsx', args)
}
