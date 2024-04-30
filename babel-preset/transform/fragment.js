import core, { types as t } from '@babel/core'

import { call, get } from './utils.js'

import { merge } from './merge.js'
import { buildPropChildren2 } from './props.js'

export function buildJSXFragment(path, state) {
	const args = [get(state, 'id/fragment')()]

	const children = merge(t.react.buildChildren(path.node))

	/*args.push(
		t.objectExpression(
			children.length > 0 ? [buildPropChildren2(children)] : [],
		),
	)*/

	return buildPropChildren2(children)

	// return call(state, 'jsx', args)

	return core.template.expression.ast`() => {
		return ${call(state, 'jsx', args)}
	}`

	/*	const identifier = path.scope.generateUidIdentifier('_jsxFragment')

	const calling = core.template.expression.ast`() => {
		return ${call(state, 'jsx', args)}
	}`

	path.scope.getProgram().push({
		id: identifier,
		init: calling,
	})
*/
	return identifier
}
