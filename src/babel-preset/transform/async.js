import { types as t } from '@babel/core'
import { transformAwait } from './await.js'
import { callFunctionImport, isInsideJSXAttribute } from './utils.js'

export function transformAsync(path, state) {
  if (!path.node.async || isInsideJSXAttribute(path)) return

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

  // `await 1` -> `const _await = await 1; _await`
  path.traverse(
    {
      AwaitExpression(path, state) {
        transformAwait(path, state)
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
  const fn = callFunctionImport(
    path,
    state,
    'pota/jsx-runtime',
    'makeAsync',
    t.arrowFunctionExpression(
      [],
      t.blockStatement(wrapStatements(path, state, stmts)),
      true,
    ),
  )

  return [first, t.returnStatement(fn)]
}
