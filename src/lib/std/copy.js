import { isNotNullObject } from './isNotNullObject.js'

export const copy = o => (isNotNullObject(o) ? structuredClone(o) : o)
