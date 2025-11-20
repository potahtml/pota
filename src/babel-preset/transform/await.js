import { types as t } from '@babel/core'

export function transformAwait(path, state) {
  const stmt = path.getStatementParent()

  const block = stmt.parentPath

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
   * So do not hoist it when the parent of `await` is the same `await`
   * statement. Replacing it, doesnt really inserts anything, but
   * inserts a "ghost empty" node that then gets double wrapped.
   */
  if (path.parentPath !== stmt) {
    const id = path.scope.generateUidIdentifier('await')

    block.node.body.splice(
      block.node.body.indexOf(stmt.node),
      0,
      t.variableDeclaration('const', [
        t.variableDeclarator(id, path.node),
      ]),
    )

    path.replaceWith(id)
  }
}
