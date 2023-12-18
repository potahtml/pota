import { noop } from '../std/noop.js'

export function copyToClipboard(s) {
	navigator.clipboard.writeText(s).then(noop).catch(noop)
}
