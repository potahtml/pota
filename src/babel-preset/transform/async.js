import { types as t } from '@babel/core'
import {
	isFunctionNamed,
	isInsideJSXAttribute,
	isNonTrackingAssignement,
} from './utils.js'

export function transformAsync(path, state) {
	if (!path.node.async || isInsideJSXAttribute(path)) return

	// make sure arrow functions are blocks
	// `() => await 1` -> `() => { return await 1 }`
	const bodyPath = path.get('body')
	const body = path.node.body
	if (!t.isBlockStatement(bodyPath)) {
		bodyPath.replaceWith(
			t.blockStatement([
				t.returnStatement(
					t.isExpression(body) ? body : body.expression,
				),
			]),
		)
	}

	// hoist await
	function replaceNodeWithVar(statementParent, varName, node) {
		const block = statementParent.parentPath

		const id = path.scope.generateUidIdentifier(varName)

		block.node.body.splice(
			block.node.body.indexOf(statementParent.node),
			0,
			t.variableDeclaration('const', [
				t.variableDeclarator(id, node.node),
			]),
		)

		node.replaceWith(id)
	}
	// `await 1` -> `const _await = await 1; _await`
	path.traverse(
		{
			AwaitExpression(path, state) {
				const stmt = path.getStatementParent()

				/**
				 * Avoid double wrapping when not hoisting the await value
				 *
				 * ```js
				 * fn(await a(), await b())
				 * ```
				 *
				 * Becomes
				 *
				 * ```js
				 * const _a = await a()
				 * const _b = await b()
				 * fn(_a, _b)
				 * ```
				 *
				 * But the following remains unchanged
				 *
				 * ```js
				 * await a()
				 * ```
				 *
				 * So do not hoist it when the parent of `await` is the same
				 * `await` statement. Replacing it, doesnt really inserts
				 * anything, but inserts a "ghost empty" node that then gets
				 * double wrapped.
				 */
				if (path.parentPath !== stmt) {
					replaceNodeWithVar(stmt, 'await', path)
				}
			},
		},
		state,
	)

	// wrap each statement in async functions
	bodyPath.node.body = wrapStatements(path, state, bodyPath.node.body)

	path.skip()
}

function wrapStatements(path, state, stmts) {
	// empty
	if (!stmts.length) {
		return []
	}

	// last
	const first = stmts.shift()
	if (!stmts.length) {
		return [first]
	}

	// wrapper
	return [
		first,
		isFunctionNamed(stmts[0], 'untrack') ||
		isFunctionNamed(stmts[0], 'ready') ||
		isFunctionNamed(stmts[0], 'readyAync') ||
		isNonTrackingAssignement(stmts[0])
			? wrapStatements(path, state, stmts)
			: t.returnStatement(
					t.arrowFunctionExpression(
						[],
						t.blockStatement(wrapStatements(path, state, stmts)),
						true,
					),
				),
	].flat(Infinity)
}
