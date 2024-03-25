import { Object } from './Object.js'

export const type = obj =>
	Object.prototype.toString.call(obj).slice(8, -1)
