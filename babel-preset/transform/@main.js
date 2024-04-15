import { types as t } from '@babel/core'
import jsx from '@babel/plugin-syntax-jsx'
import { addNamed as addNamedImport } from '@babel/helper-module-imports'

import { declare } from '@babel/helper-plugin-utils'

import { set, get, isHTMLTag } from './utils.js'

import { buildJSXElement } from './element.js'
import { buildJSXFragment } from './fragment.js'
import { buildHTMLTemplate } from './template.js'

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
				},
				JSXFragment: {
					exit(path, file) {
						const callExpr = buildJSXFragment(path, file)

						path.replaceWith(t.inherits(callExpr, path.node))
					},
				},
				JSXElement: {
					exit(path, file) {
						const callExpr = isHTMLTag(path)
							? buildHTMLTemplate(path, file)
							: buildJSXElement(path, file)

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
