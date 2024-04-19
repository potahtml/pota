import { declare } from '@babel/helper-plugin-utils'
import jsx from '@babel/plugin-syntax-jsx'
import { types as t } from '@babel/core'
import { addNamed as addNamedImport } from '@babel/helper-module-imports'

import { get, removeFromArray, set } from './utils.js'

import { buildJSXFragment } from './fragment.js'
import { buildHTMLTemplate, isHTMLTemplate } from './template.js'
import { isHTMLTag } from './html.js'
import { buildJSXComponent } from './component.js'

export default function createPlugin({ name }) {
	return declare(_ => {
		return {
			name,
			inherits: jsx.default,
			visitor: {
				JSXNamespacedName(path) {},
				JSXSpreadChild(path) {
					throw path.buildCodeFrameError(
						'Spread children are not supported.',
					)
				},
				Program: {
					enter(path, state) {
						const define = (name, id) =>
							set(state, name, createImportLazily(state, path, id))
						define('id/jsx', 'jsx')
						define('id/fragment', 'Fragment')
						define('id/template', 'template')
					},
					exit(path) {
						/** Removes empty argument `[]` from the template call */
						path.traverse({
							CallExpression(path) {
								if (isHTMLTemplate(path.node)) {
									if (path.node.arguments[1].elements.length === 0) {
										removeFromArray(
											path.node.arguments,
											path.node.arguments[1],
										)
									}
								}
							},
						})
					},
				},
				JSXFragment: {
					exit(path, state) {
						const callExpr = buildJSXFragment(path, state)

						path.replaceWith(t.inherits(callExpr, path.node))
					},
				},
				JSXElement: {
					exit(path, state) {
						const callExpr = isHTMLTag(path)
							? buildHTMLTemplate(path, state)
							: buildJSXComponent(path, state)

						path.replaceWith(t.inherits(callExpr, path.node))
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

function getSource(importName) {
	return `pota/jsx-runtime`
}

function createImportLazily(pass, path, importName) {
	return () => {
		const actualSource = getSource(importName)
		let reference = get(pass, `imports/${importName}`)
		if (reference) return t.cloneNode(reference)
		reference = addNamedImport(path, importName, actualSource, {
			importedInterop: 'uncompiled',
			importPosition: 'after',
		})
		set(pass, `imports/${importName}`, reference)
		return reference
	}
}
