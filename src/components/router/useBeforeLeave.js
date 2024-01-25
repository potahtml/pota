// local
import { Context } from './context.js'

/**
 * Run code before leaving the route, return or resolve to false to
 * reject, return true to continue
 *
 * @param {Function | Promise<unknown>} callback - Run before leaving
 *   the route
 * @url https://pota.quack.uy/Components/Router/useBeforeLeave
 */
export const useBeforeLeave = callback =>
	Context.beforeLeave.push({
		href: Context().href(),
		callback,
	})

/**
 * Returns a boolean telling if navigation is allowed
 *
 * @param {string} href
 * @returns {Promise<boolean>}
 */
export async function canNavigate(href) {
	const newBeforeLeave = []
	for (const beforeLeave of Context.beforeLeave) {
		if (href.indexOf(beforeLeave.href) !== 0) {
			if (!(await beforeLeave.callback().catch(() => false)))
				return false
		} else {
			newBeforeLeave.push(beforeLeave)
		}
	}
	Context.beforeLeave = newBeforeLeave
	return true
}
