import { isObject } from './isObject.js'

export const copy = o => (isObject(o) ? structuredClone(o) : o)
