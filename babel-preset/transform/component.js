import { types as t } from '@babel/core'

import {
	callFunction,
	callFunctionImport,
	generateUidIdentifier,
} from './utils.js'

import { buildChildren } from './children.js'
import { buildProps } from './props.js'
import { getTagFunction, getTagFunctionName } from './tag.js'

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

	const scope = path.scope

	scope.pota = scope.pota || {
		partials: {},
		components: {},
		files: {},
	}

	const pota = scope.pota

	// hoist it

	if (!pota.components[name]) {
		// identifier

		pota.components[name] = generateUidIdentifier(scope, name)

		// call

		const identifier = pota.components[name]
		const value = callFunctionImport(
			path,
			state,
			'pota/jsx-runtime',
			'createComponent',
			fn,
		)

		// push

		const statement = t.variableDeclaration('var', [
			t.variableDeclarator(identifier, value),
		])

		// for `Theme.Provider` it needs to search for `Theme`
		const binding = scope.getBinding(name.replace(/\..+$/, ''))

		switch (binding?.kind) {
			case 'module': {
				binding.path.parentPath.insertAfter(statement)

				break
			}
			case 'const':
			case 'let': {
				/*
					fix this error when using const and let:

						const _Lala = createComponent(Lala);
						const Lala = () => 'lala';

					also

						const _MyComponent = createComponent(MyComponent);
						class MyComponent extends Pota {}

				*/

				binding.path.getStatementParent().insertAfter(statement)
				break
			}
			default: {
				// "undefined" = Route.Default
				// "hoisted" = fn Comp(){ return <DefinedAfter/>} fn DefinedAfter { .. }
				scope.push({
					id: identifier,
					init: value,
				})
				break
			}
		}
	}

	// call

	return callFunction(
		pota.components[name].name,
		props ? [props] : [],
	)
}
