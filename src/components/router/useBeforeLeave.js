// local
import { Context } from './context.js'

export function useBeforeLeave(cb) {
	Context.beforeLeave.push({
		href: Context().href(),
		cb,
	})
}

// returns a boolean telling if navigation is allowed

export async function canNavigate(href) {
	const newBeforeLeave = []
	for (const beforeLeave of Context.beforeLeave) {
		if (href.indexOf(beforeLeave.href) !== 0) {
			if (!(await beforeLeave.cb().catch(() => false))) return false
		} else {
			newBeforeLeave.push(beforeLeave)
		}
	}
	Context.beforeLeave = newBeforeLeave
	return true
}
