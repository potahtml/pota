import { Object } from './Object.js'

export const typeString = obj =>
	Object.prototype.toString.call(obj).slice(8, -1)
