import core, { types as t } from '@babel/core'

/** Adds `__dev` prop to jsx as `<Component __dev={{..}}` */
export function devProps(path, state) {
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
 * Adds `__dev` argument to function calls, as
 *
 * ```js
 * signal(undefined, { __dev: {} })
 * ```
 */

export function devArguments(path, state) {
	const fn = path.node.callee?.name

	if (fn === 'render') {
		const devToolsArgument = makeFunctionSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			4,
		)
	} else if (fn === 'root') {
		const devToolsArgument = makeFunctionSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			2,
		)
	} else if (
		fn === 'effect' ||
		fn === 'syncEffect' ||
		fn === 'asyncEffect'
	) {
		const devToolsArgument = makeFunctionSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			2,
		)
	} else if (fn === 'memo') {
		const devToolsArgument = makeMemoSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			2,
		)
	} else if (fn === 'signal') {
		const devToolsArgument = makeSignalSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			2,
		)
	} else if (fn === 'Component') {
		const devToolsArgument = makeDynamicSource(path, state)

		mergeArguments(
			path,
			state,
			path.node.arguments,
			devToolsArgument,
			2,
		)
	}
}

// add or merge {__dev:..} into function argument
function mergeArguments(
	path,
	state,
	args,
	devToolsArgument,
	argNumber,
) {
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
			if (t.isObjectProperty(prop) && prop.key.name === '__dev') {
				// merge current __dev.pota with new __dev.pota
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

function makeMemoSource(path, state) {
	// todo take the name from the asignement
	return makeFunctionSource(path, state)
}

function makeSignalSource(path, state) {
	// todo take the name from the asignement
	return makeFunctionSource(path, state)
}

/**
 * ```js
 * const [read, write] = signal(val)
 * ```
 *
 * To
 *
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

	return core.template.expression.ast`{
		__dev:{
			__pota: {
				type: ${t.stringLiteral(name)},
				name: ${t.stringLiteral(name)},

				file: ${file} + ${t.stringLiteral(position)}
			}
		}
  	}`
}

/**
 * ```js
 * Component(Thing, { one: 1 })
 * ```
 *
 * To
 *
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

	return core.template.expression.ast`{
		__dev:{
			__pota: {
				type: ${t.stringLiteral('Component')},
				name: ${t.stringLiteral(name)},

				file: ${file} + ${t.stringLiteral(position)}
			}
		}
  	}`
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

	return core.template.expression.ast`{
		__pota: {
			type: ${t.stringLiteral(t.react.isCompatTag(name) && !name.includes('.') ? 'Tag' : 'Component')},
			name: ${t.stringLiteral(name)},

			file: ${file} + ${t.stringLiteral(position)}
		}
  	}`
}

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
