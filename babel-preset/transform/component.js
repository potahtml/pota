import { callFunctionImport, callFunction } from './utils.js'

import { getTagFunction, getTagFunctionName } from './tag.js'
import { buildProps } from './props.js'
import { buildChildren } from './children.js'

/** Hoist and builds call to component with props */
export function buildComponent(path, state) {
	// attributes

	const attributes = path.get('openingElement').get('attributes')

	// children

	const children = buildChildren(path)

	// props

	const props = buildProps(attributes, children)

	// component

	const fn = getTagFunction(path)
	const name = getTagFunctionName(path)

	// hoist it

	if (!state.pota.components[name]) {
		// scope

		const scope = path.scope

		// identifier

		state.pota.components[name] = scope.generateUidIdentifier(
			'_' + name,
		)

		// call

		scope.push({
			id: state.pota.components[name],
			init: callFunctionImport(state, 'createComponent', [fn]),
		})
	}

	// call

	return callFunction(
		state.pota.components[name].name,
		props ? [props] : [],
	)
}