import { types as t } from '@babel/core'

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

	return call(state, 'jsx', args)
}
