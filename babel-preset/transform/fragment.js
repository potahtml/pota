import { types as t } from '@babel/core'

import { call, get } from './utils.js'

import {
	mergeText,
	mergeTemplates,
	mergeTextToTemplate,
} from './merge.js'

import { buildChildrenProperty } from './children.js'

export function buildJSXFragment(path, file) {
	const args = [get(file, 'id/fragment')()]

	let children = t.react.buildChildren(path.node)

	children = mergeText(children)
	children = mergeTemplates(children)
	children = mergeTextToTemplate(children)

	args.push(
		t.objectExpression(
			children.length > 0 ? [buildChildrenProperty(children)] : [],
		),
	)

	return call(file, 'jsx', args)
}
