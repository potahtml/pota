import { types as t } from '@babel/core'

import { call, clearEmptyExtraChilden, getTag } from './utils.js'

import {
	mergeTemplates,
	mergeText,
	mergeTextToTemplate,
} from './merge.js'

import { buildProps } from './attributes.js'

export function buildJSXElement(path, file) {
	// attributes

	const args = [getTag(path)]
	const attributes = []
	for (const attr of path.get('openingElement').get('attributes')) {
		attributes.push(attr)
	}

	// children

	let children = t.react.buildChildren(path.node)

	children = mergeText(children)
	children = mergeTemplates(children)
	children = mergeTextToTemplate(children)

	clearEmptyExtraChilden(children)

	// props

	const props = buildProps(attributes, children)
	if (props) {
		args.push(props)
	}

	// call

	return call(file, 'jsx', args)
}
