import * as core from '@babel/core'
const t = core.types

/** Adds `__dev` prop to jsx as `<Component __dev={{..}}` */
export function devToolsProps(path, state) {
	const attributes = []

	attributes.push(
		t.jsxAttribute(
			t.jsxIdentifier('__dev'),
			t.jsxExpressionContainer(makeComponentSource(path, state)),
		),
	)
	path.pushContainer('attributes', attributes)
}

/**
 * Adds `__dev` argument to declarations
 *
 * ```js
 * const [something] = signal(undefined, {
 * 	__dev: { __pota: { name: something, etc } },
 * })
 * ```
 */

export function devToolsDeclaration(path, state) {
	for (const declaration of path.node.declarations) {
		const fn = declaration.init?.callee?.name

		switch (fn) {
			case 'signal': {
				const devToolsArgument = makeDeclarationSource(
					path,
					declaration,
					state,
				)
				mergeArguments(
					declaration.init.arguments,
					devToolsArgument,
					2,
				)

				break
			}
			case 'memo': {
				const devToolsArgument = makeDeclarationSource(
					path,
					declaration,
					state,
				)
				mergeArguments(
					declaration.init.arguments,
					devToolsArgument,
					2,
				)

				break
			}
		}
	}
}

/**
 * Adds `__dev` argument to assignments
 *
 * ```js
 * property[something] = signal(undefined, {
 * 	__dev: { __pota: { name: 'property[something]', etc } },
 * })
 * ```
 */

export function devToolsAssignment(path, state) {
	const fn = path.node.right.callee?.name

	switch (fn) {
		case 'signal': {
			const devToolsArgument = makeAssignementSource(path, state)
			mergeArguments(path.node.right.arguments, devToolsArgument, 2)

			break
		}

		case 'memo': {
			const devToolsArgument = makeAssignementSource(path, state)
			mergeArguments(path.node.right.arguments, devToolsArgument, 2)

			break
		}
	}
}

/**
 * Adds `__dev` argument to function calls, as
 *
 * ```js
 * signal(undefined, { __dev: {} })
 * ```
 */

export function devToolsArguments(path, state) {
	const fn = path.node.callee?.name

	switch (fn) {
		// assignments/declarations adds dev args last
		case 'signal':
		case 'memo': {
			const devToolsArgument = makeFunctionSource(path, state)
			mergeArguments(path.node.arguments, devToolsArgument, 2)

			break
		}

		// function calls
		case 'render': {
			const devToolsArgument = makeFunctionSource(path, state)
			mergeArguments(path.node.arguments, devToolsArgument, 4)

			break
		}
		case 'root': {
			const devToolsArgument = makeFunctionSource(path, state)
			mergeArguments(path.node.arguments, devToolsArgument, 2)

			break
		}
		case 'effect':
		case 'syncEffect':
		case 'asyncEffect': {
			const devToolsArgument = makeFunctionSource(path, state)

			mergeArguments(path.node.arguments, devToolsArgument, 2)

			break
		}

		case 'Component': {
			const devToolsArgument = makeDynamicSource(path, state)

			mergeArguments(path.node.arguments, devToolsArgument, 2)

			break
		}
	}
}

// add or merge {__dev:..} into function argument
function mergeArguments(args, devToolsArgument, argNumber) {
	argNumber = argNumber - 1

	// pad arguments
	while (args.length < argNumber) {
		args.push(t.buildUndefinedNode())
	}

	if (!args[argNumber]) {
		// the argument is not there just push it
		args.push(devToolsArgument)
	} else if (t.isObjectExpression(args[argNumber])) {
		// the argument is there, if it is an object try to merge it

		// merge current __dev with new __dev
		for (const prop of args[argNumber].properties) {
			// merge current __dev.pota with new __dev.pota
			if (t.isObjectProperty(prop) && prop.key.name === '__dev') {
				for (const _prop of prop.value.properties) {
					if (
						t.isObjectProperty(_prop) &&
						_prop.key.name === '__pota'
					) {
						_prop.value.properties.unshift(
							...devToolsArgument.properties[0].value.properties[0]
								.value.properties,
						)
					}
				}
				return
			}
		}

		// the argument is there, __dev doesnt exists, add it
		args[argNumber].properties.push(...devToolsArgument.properties)
	}
}

/**
 * ```js
 * signal(val, {
 * 	__dev: { name: 'signal' },
 * })
 * ```
 *
 * @returns {t.ObjectExpression}
 */
function makeFunctionSource(path, state) {
	// filename

	const filename = path.scope
		.getProgramParent()
		.path.hub.file.opts.filename.replace(/\\/g, '/')

	const file = getFilenameIdentifier(path, state, filename)

	// position

	const line = path.node.loc.start.line || 0
	const col = path.node.loc?.start?.column + 1 || 0
	const position = ':' + line + ':' + col

	// source

	const name = path.node.callee.name

	return makeDevObject(name, name, file, position)
}

/**
 * ```js
 * Component(Thing, { one: 1, __dev: { name: 'Thing' } })
 * ```
 */

function makeDynamicSource(path, state) {
	// filename

	const filename = path.scope
		.getProgramParent()
		.path.hub.file.opts.filename.replace(/\\/g, '/')

	const file = getFilenameIdentifier(path, state, filename)

	// position

	const line = path.node.loc.start.line || 0
	const col = path.node.loc?.start?.column + 1 || 0
	const position = ':' + line + ':' + col

	// component

	const component = path.node.arguments[0]
	let name
	if (t.isMemberExpression(component)) {
		name = component.object.name + '.' + component.property.name
	} else if (t.isStringLiteral(component)) {
		name = component.value
	} else {
		name = component.name || 'unknown'
	}

	return makeDevObject('component', name, file, position)
}

/**
 * ```js
 * ;<Thing bla="test" />
 * ```
 *
 * To
 *
 * ```js
 * Component(Thing, { __dev: { name: 'Thing' } })
 * ```
 */
function makeComponentSource(path, state) {
	const location = path.node.loc
	if (!location) {
		return path.scope.buildUndefinedNode()
	}

	// filename

	const filename = state.filename.replace(/\\/g, '/')
	const file = getFilenameIdentifier(path, state, filename)

	// position

	const line = location.start.line || 0
	const col = location.start?.column + 1 || 0
	const position = ':' + line + ':' + col

	// component

	const name = path.node.name.object
		? path.node.name.object.name + '.' + path.node.name.property.name
		: path.node.name.name || 'unknown'

	return makePotaObject(
		t.react.isCompatTag(name) && !name.includes('.')
			? 'element'
			: 'component',
		name,
		file,
		position,
	)
}

/**
 * ```js
 * property[something] = signal(val, {
 * 	__dev: { __pota: { name: 'property[something]' } },
 * })
 * ```
 *
 * @returns {t.ObjectExpression}
 */
function makeAssignementSource(path, state) {
	// filename

	const filename = path.scope
		.getProgramParent()
		.path.hub.file.opts.filename.replace(/\\/g, '/')

	const file = getFilenameIdentifier(path, state, filename)

	// position

	const line = path.node.left.loc.start.line || 0
	const col = path.node.left.loc?.start?.column + 1 || 0
	const position = ':' + line + ':' + col

	// source

	const kind = path.node.right.callee.name
	const name = state.file.code.slice(
		path.node.left.start,
		path.node.left.end,
	)

	return makeDevObject(kind, name, file, position)
}

/**
 * ```js
 * const [something, write] = signal(val, {
 * 	__dev: { __pota: { name: 'something' } },
 * })
 * ```
 *
 * @returns {t.ObjectExpression}
 */
function makeDeclarationSource(path, declaration, state) {
	// filename

	const filename = path.scope
		.getProgramParent()
		.path.hub.file.opts.filename.replace(/\\/g, '/')

	const file = getFilenameIdentifier(path, state, filename)

	// position

	const line = path.node.loc.start.line || 0
	const col = path.node.loc?.start?.column + 1 || 0
	const position = ':' + line + ':' + col

	// source

	const kind = declaration.init.callee.name

	let name = 'unknown'

	switch (declaration.id.type) {
		case 'ArrayPattern': {
			// array signal destructuring
			name = declaration.id.elements[0].name
			break
		}
		case 'ObjectPattern': {
			// object signal destructuring
			name = declaration.id.properties.find(
				item => item.key.name === 'read',
			).value.name
			break
		}
		case 'Identifier': {
			// memo/signal
			name = declaration.id.name
			break
		}
	}

	return makeDevObject(kind, name, file, position)
}

// hoists file name

function getFilenameIdentifier(path, state, filename) {
	if (!state.pota.files[filename]) {
		const scope = path.scope.getProgramParent()

		state.pota.files[filename] =
			scope.generateUidIdentifier('_filename')

		scope.push({
			id: state.pota.files[filename],
			init: t.stringLiteral(filename),
		})
	}

	return state.pota.files[filename]
}

function makeDevObject(kind, name, file, position) {
	return core.template.expression.ast`{
		__dev:{
			__pota: {
				kind: ${t.stringLiteral(kind)},
				name: ${t.stringLiteral(name)},

				file: ${file} + ${t.stringLiteral(position)}
			}
		}
  	}`
}

function makePotaObject(kind, name, file, position) {
	return core.template.expression.ast`{
		__pota: {
			kind: ${t.stringLiteral(kind)},
			name: ${t.stringLiteral(name)},

			file: ${file} + ${t.stringLiteral(position)}
		}
  	}`
}
