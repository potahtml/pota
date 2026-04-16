import { types as t } from '@babel/core'
import { declare } from '@babel/helper-plugin-utils'
import jsx from '@babel/plugin-syntax-jsx'

import { error, filename } from './utils.js'

import { buildComponent } from './component.js'
import { buildFragment } from './fragment.js'
import { buildPartial, isPartial, partialMerge } from './partial.js'
import { isXHTMLTag } from './tag.js'

import {
	devToolsArguments,
	devToolsAssignment,
	devToolsDeclaration,
	devToolsProps,
} from './devTools.js'

export default function createPlugin({ name }) {
	return declare((_, options) => {
		return {
			name,
			inherits: jsx.default,
			visitor: {
				JSXSpreadChild(path, state) {
					if (state.pota.skip) return
					// TODO
					error(path, 'Spread children are not supported.')
				},
				Program: {
					enter(path, state) {
						/** Pota babel state */

						state.pota = { partials: {}, components: {}, files: {} }

						// Skip files with a foreign JSX pragma
						const comments =
							/** @type {Babel.File} */ (path.parent).comments || []
						for (const comment of comments) {
							const value = comment.value
							const sourceMatch = value.match(
								/@jsxImportSource\s+(\S+)/,
							)
							if (sourceMatch) {
								if (sourceMatch[1] !== 'pota') {
									state.pota.skip = true
								}
								break
							}
							if (/@jsx\s/.test(value)) {
								state.pota.skip = true
								break
							}
						}
						if (state.pota.skip) return

						if (false && options?.development) {
							path.traverse(
								{
									/** Add debugging arguments to reactive functions */
									CallExpression(path, state) {
										devToolsArguments(path, state)
									},

									/** Add debugging properties to components */
									JSXOpeningElement(path, state) {
										devToolsProps(path, state)
									},

									/** Add debugging properties to assignment */
									AssignmentExpression(path, state) {
										devToolsAssignment(path, state)
									},

									/** Add debugging properties to declaration */
									VariableDeclaration(path, state) {
										devToolsDeclaration(path, state)
									},
								},
								state,
							)
						}
					},
					exit(path, state) {
						if (state.pota.skip) return

						/** Merge and hoist partial calls */
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
						if (state.pota.skip) return

						const expression = buildFragment(path, state)

						path.replaceWith(t.inherits(expression, path.node))
					},
				},
				JSXElement: {
					exit(path, state) {
						if (state.pota.skip) return

						const expression = isXHTMLTag(path)
							? buildPartial(path, state)
							: buildComponent(path, state)

						path.replaceWith(t.inherits(expression, path.node))
					},
				},
				JSXAttribute(path, state) {
					if (state.pota.skip) return

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
