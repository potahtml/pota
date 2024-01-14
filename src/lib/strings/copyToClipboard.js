import { noop } from '../std/noop.js'

export const copyToClipboard = s =>
	navigator.clipboard.writeText(s).then(noop).catch(noop)
