/**
 * Safe guard. `decodeURIComponent` will fail with malformed strings:
 * links are copied, pasted, manipulated by people, software etc
 *
 * @param {string} string - String to decode
 * @returns {string} Returns decoded string or original string on
 *   error
 */
function _decodeURIComponent(string) {
	try {
		return decodeURIComponent(string)
	} catch (e) {
		return string
	}
}
export { _decodeURIComponent as decodeURIComponent }
