import core, { types as t } from '@babel/core'

import { call, getTag } from './utils.js'

import { merge } from './merge.js'
import { buildProps } from './props.js'

export function buildJSXComponent(path, state) {
	// arguments

	const args = [getTag(path)]

	// attributes

	const attributes = path.get('openingElement').get('attributes')

	// children

	const children = merge(t.react.buildChildren(path.node))

	// props

	const props = buildProps(attributes, children)
	if (props) {
		args.push(props)
	}

	// call

	const identifier = path.scope.generateUidIdentifier('_jsxComponent')

	path.scope.push({
		id: identifier,
		init: core.template.expression
			.ast`() => ${call(state, 'jsx', args)}`,
	})

	/*const binding = path.scope.getBinding(
		Object.keys(path.scope.bindings).at(-1),
	)
	console.log(binding)
	binding.insertAfter(
		t.variableDeclarator({
			id: identifier,
			init: core.template.expression
				.ast`() => ${call(state, 'jsx', args)}`,
		}),
	)*/

	/*path.insertAfter(
		t.variableDeclarator({
			id: identifier,
			init: core.template.expression
				.ast`() => ${call(state, 'jsx', args)}`,
		}),
	)*/

	return identifier

	return core.template.expression
		.ast`() => ${call(state, 'jsx', args)}`

	return call(state, 'jsx', args)
}
