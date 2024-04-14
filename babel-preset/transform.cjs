'use strict'

Object.defineProperty(exports, '__esModule', {
	value: true,
})
exports.default = createPlugin

var _pluginSyntaxJsx = require('@babel/plugin-syntax-jsx')
var _helperPluginUtils = require('@babel/helper-plugin-utils')
var _core = require('@babel/core')
var _helperModuleImports = require('@babel/helper-module-imports')

const get = (pass, name) =>
	pass.get(`@babel/plugin-react-jsx/${name}`)

const set = (pass, name, v) =>
	pass.set(`@babel/plugin-react-jsx/${name}`, v)

function hasProto(node) {
	return node.properties.some(
		value =>
			_core.types.isObjectProperty(value, {
				computed: false,
				shorthand: false,
			}) &&
			(_core.types.isIdentifier(value.key, {
				name: '__proto__',
			}) ||
				_core.types.isStringLiteral(value.key, {
					value: '__proto__',
				})),
	)
}

function createPlugin({ name }) {
	return (0, _helperPluginUtils.declare)(_ => {
		return {
			name,
			inherits: _pluginSyntaxJsx.default,
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
							set(
								state,
								name,
								createImportLazily(state, path, id, 'pota'),
							)
						define('id/jsx', 'jsx')
						define('id/fragment', 'Fragment')
					},
				},
				JSXFragment: {
					exit(path, file) {
						let callExpr = buildJSXFragmentCall(path, file)

						path.replaceWith(
							_core.types.inherits(callExpr, path.node),
						)
					},
				},
				JSXElement: {
					exit(path, file) {
						let callExpr = buildJSXElementCall(path, file)

						path.replaceWith(
							_core.types.inherits(callExpr, path.node),
						)
					},
				},
				JSXAttribute(path) {
					if (_core.types.isJSXElement(path.node.value)) {
						path.node.value = _core.types.jsxExpressionContainer(
							path.node.value,
						)
					}
				},
			},
		}

		function call(pass, name, args) {
			const node = _core.types.callExpression(
				get(pass, `id/${name}`)(),
				args,
			)

			return node
		}

		function convertJSXIdentifier(node, parent) {
			if (_core.types.isJSXIdentifier(node)) {
				if (
					node.name === 'this' &&
					_core.types.isReferenced(node, parent)
				) {
					return _core.types.thisExpression()
				} else if (_core.types.isValidIdentifier(node.name, false)) {
					node.type = 'Identifier'
					return node
				} else {
					return _core.types.stringLiteral(node.name)
				}
			} else if (_core.types.isJSXMemberExpression(node)) {
				return _core.types.memberExpression(
					convertJSXIdentifier(node.object, node),
					convertJSXIdentifier(node.property, node),
				)
			} else if (_core.types.isJSXNamespacedName(node)) {
				return _core.types.stringLiteral(
					`${node.namespace.name}:${node.name.name}`,
				)
			}
			return node
		}

		function convertAttributeValue(node) {
			if (_core.types.isJSXExpressionContainer(node)) {
				return node.expression
			} else {
				return node
			}
		}

		function accumulateAttribute(array, attribute) {
			if (_core.types.isJSXSpreadAttribute(attribute.node)) {
				const arg = attribute.node.argument
				if (_core.types.isObjectExpression(arg) && !hasProto(arg)) {
					array.push(...arg.properties)
				} else {
					array.push(_core.types.spreadElement(arg))
				}
				return array
			}
			const value = convertAttributeValue(
				attribute.node.value || _core.types.booleanLiteral(true),
			)

			if (
				_core.types.isStringLiteral(value) &&
				!_core.types.isJSXExpressionContainer(attribute.node.value)
			) {
				var _value$extra
				value.value = value.value.replace(/\n\s+/g, ' ')
				;(_value$extra = value.extra) == null ||
					delete _value$extra.raw
			}
			if (_core.types.isJSXNamespacedName(attribute.node.name)) {
				attribute.node.name = _core.types.stringLiteral(
					attribute.node.name.namespace.name +
						':' +
						attribute.node.name.name.name,
				)
			} else if (
				_core.types.isValidIdentifier(attribute.node.name.name, false)
			) {
				attribute.node.name.type = 'Identifier'
			} else {
				attribute.node.name = _core.types.stringLiteral(
					attribute.node.name.name,
				)
			}
			array.push(
				_core.types.inherits(
					_core.types.objectProperty(attribute.node.name, value),
					attribute.node,
				),
			)
			return array
		}

		function buildChildrenProperty(children) {
			let childrenNode
			if (children.length === 1) {
				childrenNode = children[0]
			} else if (children.length > 1) {
				childrenNode = _core.types.arrayExpression(children)
			} else {
				return undefined
			}
			return _core.types.objectProperty(
				_core.types.identifier('children'),
				childrenNode,
			)
		}

		function buildJSXElementCall(path, file) {
			const openingPath = path.get('openingElement')
			const args = [getTag(openingPath)]
			const attribsArray = []
			for (const attr of openingPath.get('attributes')) {
				if (
					attr.isJSXAttribute() &&
					_core.types.isJSXIdentifier(attr.node.name)
				) {
					attribsArray.push(attr)
				} else {
					attribsArray.push(attr)
				}
			}
			const children = _core.types.react.buildChildren(path.node)
			let attribs
			if (attribsArray.length || children.length) {
				attribs = buildJSXOpeningElementAttributes(
					attribsArray,
					children,
				)
			} else {
				attribs = _core.types.objectExpression([])
			}
			args.push(attribs)

			return call(file, 'jsx', args)
		}

		function buildJSXOpeningElementAttributes(attribs, children) {
			const props = attribs.reduce(accumulateAttribute, [])
			if ((children == null ? void 0 : children.length) > 0) {
				props.push(buildChildrenProperty(children))
			}
			return _core.types.objectExpression(props)
		}

		function buildJSXFragmentCall(path, file) {
			const args = [get(file, 'id/fragment')()]
			const children = _core.types.react.buildChildren(path.node)
			args.push(
				_core.types.objectExpression(
					children.length > 0
						? [buildChildrenProperty(children)]
						: [],
				),
			)

			return call(file, 'jsx', args)
		}

		function getTag(openingPath) {
			const tagExpr = convertJSXIdentifier(
				openingPath.node.name,
				openingPath.node,
			)
			let tagName
			if (_core.types.isIdentifier(tagExpr)) {
				tagName = tagExpr.name
			} else if (_core.types.isStringLiteral(tagExpr)) {
				tagName = tagExpr.value
			}
			if (_core.types.react.isCompatTag(tagName)) {
				return _core.types.stringLiteral(tagName)
			} else {
				return tagExpr
			}
		}
	})

	function getSource(source, importName) {
		switch (importName) {
			case 'Fragment':
			case 'jsx':
			case 'template':
				return `pota/jsx-runtime`
		}
	}

	function createImportLazily(pass, path, importName, source) {
		return () => {
			const actualSource = getSource(source, importName)
			if ((0, _helperModuleImports.isModule)(path)) {
				let reference = get(pass, `imports/${importName}`)
				if (reference) return _core.types.cloneNode(reference)
				reference = (0, _helperModuleImports.addNamed)(
					path,
					importName,
					actualSource,
					{
						importedInterop: 'uncompiled',
						importPosition: 'after',
					},
				)
				set(pass, `imports/${importName}`, reference)
				return reference
			} else {
				let reference = get(pass, `requires/${actualSource}`)
				if (reference) {
					reference = _core.types.cloneNode(reference)
				} else {
					reference = (0, _helperModuleImports.addNamespace)(
						path,
						actualSource,
						{
							importedInterop: 'uncompiled',
						},
					)
					set(pass, `requires/${actualSource}`, reference)
				}
				return _core.types.memberExpression(
					reference,
					_core.types.identifier(importName),
				)
			}
		}
	}
}
