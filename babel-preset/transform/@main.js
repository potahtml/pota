import { declare } from '@babel/helper-plugin-utils'
import { types as t } from '@babel/core'
import jsx from '@babel/plugin-syntax-jsx'

import { createImport, error } from './utils.js'

import { buildComponent } from './component.js'
import { buildFragment } from './fragment.js'
import { buildPartial, partialMerge, isPartial } from './partial.js'
import { isTagXHTML } from './tag.js'

import {
	devArguments,
	devProps,
	devAssignment,
	devDeclaration,
} from './development.js'

export default function createPlugin({ name }) {
	return declare((_, options) => {
		return {
			name,
			inherits: jsx.default,
			visitor: {
				JSXNamespacedName(path) {},
				JSXSpreadChild(path) {
					error(path, 'Spread children are not supported.')
				},
				Program: {
					enter(path, state) {
						/** Pota babel state */

						state.pota = { partials: {}, components: {}, files: {} }

						createImport(path, state, 'createPartial')
						createImport(path, state, 'createComponent')

						if (options?.development) {
							path.traverse(
								{
									/** Add debugging arguments to reactive functions */
									CallExpression(path, state) {
										devArguments(path, state)
									},

									/** Add debugging properties to components */
									JSXOpeningElement(path, state) {
										devProps(path, state)
									},

									/** Add debugging properties to assignment */
									AssignmentExpression(path, state) {
										devAssignment(path, state)
									},

									/** Add debugging properties to declaration */
									VariableDeclaration(path, state) {
										devDeclaration(path, state)
									},
								},
								state,
							)
						}
					},
					exit(path, state) {
						/** Hoist and merge partial calls */
						path.traverse(
							{
								CallExpression(path, state) {
									if (isPartial(path.node)) {
										const expression = partialMerge(path, state)

										path.replaceWith(
											t.inherits(expression, path.node),
										)
									}
								},
							},
							state,
						)
					},
				},
				JSXFragment: {
					exit(path, state) {
						const expression = buildFragment(path, state)

						path.replaceWith(t.inherits(expression, path.node))
					},
				},
				JSXElement: {
					exit(path, state) {
						const expression = isTagXHTML(path)
							? buildPartial(path, state)
							: buildComponent(path, state)

						path.replaceWith(t.inherits(expression, path.node))
					},
				},
				JSXAttribute(path) {
					if (t.isJSXElement(path.node.value)) {
						path.node.value = t.jsxExpressionContainer(
							path.node.value,
						)
					}
				},
			},
		}
	})
}
