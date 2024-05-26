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

	// scope

	/**
	 * Bug: the identifier should be added after the binding, not at the
	 * top of the scope, I have no idea how to do this.
	 */
	const scope = path.scope //.getProgramParent()

	scope.pota = scope.pota || {
		partials: {},
		components: {},
		files: {},
	}

	const pota = scope.pota

	// hoist it

	if (!pota.components[name]) {
		// identifier

		pota.components[name] = scope.generateUidIdentifier('_' + name)

		// call

		scope.push({
			id: pota.components[name],
			init: callFunctionImport(state, 'createComponent', [fn]),
		})
	}

	// call

	return callFunction(
		pota.components[name].name,
		props ? [props] : [],
	)
}
