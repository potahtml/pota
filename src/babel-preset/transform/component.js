import { types as t } from '@babel/core'

import { callFunction, callFunctionImport } from './utils.js'

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

		pota.components[name] = scope.generateUidIdentifier(name)

		// call

		const identifier = pota.components[name]
		const value = callFunctionImport(state, 'createComponent', [fn])

		// push

		const binding = scope.getBinding(name)
		switch (binding?.kind) {
			case 'module': {
				binding.path.parentPath.insertAfter(
					t.variableDeclaration('const', [
						t.variableDeclarator(identifier, value),
					]),
				)
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

				binding.path
					.getStatementParent()
					.insertAfter(
						t.variableDeclaration('const', [
							t.variableDeclarator(identifier, value),
						]),
					)
				break
			}
			default: {
				// "undefined" = Router.Default
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
