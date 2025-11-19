import { types as t } from '@babel/core'

export function transformAwait(path, state) {
  const id = path.scope.generateUidIdentifier('await')

  const stmt = path.getStatementParent()

  const block = stmt.parentPath

  block.node.body.splice(
    block.node.body.indexOf(stmt.node),
    0,
    t.variableDeclaration('const', [
      t.variableDeclarator(id, path.node),
    ]),
  )

  path.replaceWith(id)
}
