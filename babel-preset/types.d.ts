import type * as t from '@babel/types'
import type {
	NodePath as BabelNodePath,
	PluginPass as BabelPluginPass,
} from '@babel/core'

/**
 * Module augmentations for pota's babel preset.
 *
 * - Attaches pota-specific state to Babel's `PluginPass` so visitors
 *   can store per-file/per-scope bookkeeping.
 * - Attaches compile-time marker properties to `CallExpression` so
 *   partial calls can be identified and merged upstream without a
 *   WeakMap side-table.
 * - Exposes `@babel/types` as the global `Babel` namespace so JSDoc
 *   annotations can write `{Babel.File}` instead of
 *   `{import('@babel/types').File}`.
 */

declare module '@babel/core' {
	interface PluginPass {
		pota: {
			partials: Record<string, t.Identifier>
			components: Record<string, t.Identifier>
			files: Record<string, t.Identifier>
			skip?: boolean
		}
	}
}

declare module '@babel/types' {
	interface CallExpression {
		isPartial?: boolean
		xmlns?: string
		tagName?: string
		isImportNode?: boolean
	}
}

declare global {
	namespace Babel {
		export type * from '@babel/types'

		// Babel core re-exports
		type NodePath<
			T extends t.Node | null | undefined = t.Node,
		> = BabelNodePath<T>
		type PluginPass = BabelPluginPass
	}
}
