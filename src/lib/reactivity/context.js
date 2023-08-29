import { context, useContext } from '#main'
import { empty } from '#std'

function _context(defaultValue = empty()) {
	const Context = context(defaultValue)
	function getContext() {
		return useContext(Context)
	}
	getContext.Provider = Context.Provider
	return getContext
}
export { _context as context }
