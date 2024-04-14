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
							set(state, name, createImportLazily(state, path, id))
						define('id/jsx', 'jsx')
						define('id/fragment', 'Fragment')
						define('id/template', 'template')
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

			const tag = isTag(openingPath)
			if (tag) {
				return buildHTMLTemplateCall(openingPath, path, file, tag)
			}

			// attributes
			const args = [getTag(openingPath)]
			const attributes = []
			for (const attr of openingPath.get('attributes')) {
				attributes.push(attr)
			}

			// children
			let children = _core.types.react.buildChildren(path.node)
			children = mergeText(children)
			children = mergeTemplates(children)
			children = mergeTextToTemplate(children)

			// props
			if (attributes.length || children.length) {
				let props = buildJSXOpeningElementAttributes(
					attributes,
					children,
				)
				if (props.length) {
					args.push(_core.types.objectExpression(props))
				}
			}

			// call
			return call(file, 'jsx', args)
		}

		function buildHTMLTemplateCall(openingPath, path, file, tag) {
			const args = []

			// open tag
			tag.content = `<${tag.name}`

			// attributes
			const attributes = []
			for (const attr of openingPath.get('attributes')) {
				if (
					attr.isJSXAttribute() &&
					_core.types.isJSXIdentifier(attr.node.name)
				) {
					const name = attr.node.name.name

					if (name !== 'xmlns' && isAttributeLiteral(attr.node)) {
						const value = getAttributeLiteral(attr.node)

						mergeAttributeToTag(tag, name, value)

						continue
					}
					attributes.push(attr)
				} else {
					attributes.push(attr)
				}
			}

			// close opening tag
			if (isVoidElement(tag.name)) {
				tag.content += ` />`
			} else {
				tag.content += `>`
			}

			// children
			let children = _core.types.react.buildChildren(path.node)
			children = mergeChildrenToTag(children, tag)
			children = mergeText(children)
			children = mergeTemplates(children)
			children = mergeTextToTemplate(children)

			// props
			if (attributes.length || children.length) {
				let props = buildJSXOpeningElementAttributes(
					attributes,
					children,
				)
				if (props.length) {
					args.push(_core.types.objectExpression(props))
				}
			}

			// close tag
			if (!isVoidElement(tag.name)) {
				tag.content += `</${tag.name}>`
			}

			// call
			args.unshift(_core.types.stringLiteral(tag.content))
			return call(file, 'template', args)
		}

		function buildJSXOpeningElementAttributes(attribs, children) {
			const props = attribs.reduce(accumulateAttribute, [])
			if ((children == null ? void 0 : children.length) > 0) {
				props.push(buildChildrenProperty(children))
			}
			return props
		}

		function buildJSXFragmentCall(path, file) {
			const args = [get(file, 'id/fragment')()]
			let children = _core.types.react.buildChildren(path.node)

			children = mergeText(children)
			children = mergeTemplates(children)
			children = mergeTextToTemplate(children)

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

		// tags
		function isTag(openingPath) {
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
				return { name: tagName }
			} else {
				return false
			}
		}
		function isVoidElement(tagName) {
			switch (tagName.toLowerCase()) {
				case 'area':
				case 'base':
				case 'br':
				case 'col':
				case 'embed':
				case 'hr':
				case 'img':
				case 'input':
				case 'link':
				case 'meta':
				case 'param':
				case 'source':
				case 'track':
				case 'wbr': {
					return true
				}
				default: {
					return false
				}
			}
		}

		// attributes
		function isAttributeLiteral(node) {
			return (
				_core.types.isStringLiteral(node.value) ||
				_core.types.isNumericLiteral(node.value) ||
				_core.types.isStringLiteral(node.value?.expression) ||
				_core.types.isNumericLiteral(node.value?.expression)
			)
		}
		function getAttributeLiteral(node) {
			if (
				_core.types.isStringLiteral(node.value.expression) ||
				_core.types.isNumericLiteral(node.value.expression)
			) {
				return escapeAttribute(String(node.value.expression.value))
			}
			return escapeAttribute(String(node.value.value))
		}

		// children literal
		function isChildrenLiteral(node) {
			return (
				_core.types.isStringLiteral(node) ||
				_core.types.isNumericLiteral(node) ||
				_core.types.isStringLiteral(node.value?.expression) ||
				_core.types.isNumericLiteral(node.value?.expression)
			)
		}
		function getChildrenLiteral(node) {
			if (
				_core.types.isStringLiteral(node.value?.expression) ||
				_core.types.isNumericLiteral(node.value?.expression)
			) {
				return escapeHTML(node.value?.expression.value)
			}
			return escapeHTML(node.value)
		}

		// template call
		function isHTMLTemplateCall(node) {
			return (
				_core.types.isCallExpression(node) &&
				node.arguments.length === 1 &&
				node.arguments[0].type === 'StringLiteral' &&
				node.callee?.name === '_template'
			)
		}
		function getHTMLTemplateCall(node) {
			return node.arguments[0].value
		}

		// attributes
		function mergeAttributeToTag(tag, name, value) {
			if (value.trim() === '') {
				tag.content += ' ' + name
				return
			}

			if (/"|'|=|<|>|`|\s/.test(value)) {
				tag.content += ' ' + name + '="' + value + '"'
				return
			}

			tag.content += ' ' + name + '=' + value
		}

		// children
		function mergeChildrenToTag(children, tag) {
			/**
			 * ```js
			 * Component('a', { children: ['1', '2'] })
			 *
			 * into`<a>12`
			 * ```
			 */

			const toRemove = []

			for (let i = 0; i < children.length; i++) {
				const node = children[i]
				if (isChildrenLiteral(node)) {
					tag.content += getChildrenLiteral(node)
					toRemove.push(node)
					continue
				}
				if (isHTMLTemplateCall(node)) {
					tag.content += getHTMLTemplateCall(node)
					toRemove.push(node)
					continue
				}
				break
			}

			return children.filter(child => !toRemove.includes(child))
		}

		function mergeText(children) {
			/**
			 * ```js
			 * ;['1', '2']
			 *
			 * into
			 * ;['12']
			 * ```
			 */
			const toRemove = []
			for (let i = 0; i < children.length; i++) {
				const node = children[i]
				if (isChildrenLiteral(node)) {
					let nextSibling = children[++i]
					while (nextSibling && isChildrenLiteral(nextSibling)) {
						node.value += getChildrenLiteral(nextSibling)
						toRemove.push(nextSibling)
						nextSibling = children[++i]
					}
				}
			}
			return children.filter(child => !toRemove.includes(child))
		}
		function mergeTemplates(children) {
			/**
			 * ```js
			 * template('1'), '2', template('3')
			 *
			 * into
			 *
			 * template('123')
			 * ```
			 */
			const toRemove = []
			for (let i = 0; i < children.length; i++) {
				const node = children[i]
				if (isHTMLTemplateCall(node)) {
					let nextSibling = children[++i]
					while (nextSibling) {
						if (isHTMLTemplateCall(nextSibling)) {
							node.arguments[0].value +=
								getHTMLTemplateCall(nextSibling)

							toRemove.push(nextSibling)
							nextSibling = children[++i]
						} else if (isChildrenLiteral(nextSibling)) {
							node.arguments[0].value +=
								getChildrenLiteral(nextSibling)

							toRemove.push(nextSibling)
							nextSibling = children[++i]
						} else {
							break
						}
					}
				}
			}
			return children.filter(child => !toRemove.includes(child))
		}
		function mergeTextToTemplate(children) {
			/**
			 * ```js
			 * ;['1', template('2')]
			 *
			 * into
			 *
			 * template('12')
			 * ```
			 */
			const toRemove = []
			for (let i = 0; i < children.length; i++) {
				const node = children[i]
				let nextSibling = children[++i]
				if (
					isChildrenLiteral(node) &&
					nextSibling &&
					isHTMLTemplateCall(nextSibling)
				) {
					nextSibling.arguments[0].value =
						getChildrenLiteral(node) +
						getHTMLTemplateCall(nextSibling)
					toRemove.push(node)
				}
			}
			return children.filter(child => !toRemove.includes(child))
		}

		function escapeHTML(s) {
			return s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
		}
		function escapeAttribute(s) {
			return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
		}
	})

	function getSource(importName) {
		return `pota/jsx-runtime`
	}

	function createImportLazily(pass, path, importName) {
		return () => {
			const actualSource = getSource(importName)
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
