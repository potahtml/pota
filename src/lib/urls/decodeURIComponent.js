// malformed params will fail to decode
// the safe guard is there because links are copied, pasted, manipulated by people, software etc
function _decodeURIComponent(s) {
	try {
		return decodeURIComponent(s)
	} catch (e) {
		return s
	}
}
export { _decodeURIComponent as decodeURIComponent }
