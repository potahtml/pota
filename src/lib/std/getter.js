import { defineProperty } from './defineProperty.js'

export const getter = (object, key, get) =>
	defineProperty(object, key, {
		get,
	})
