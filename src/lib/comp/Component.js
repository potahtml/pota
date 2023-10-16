import { $class } from './class.js'

export class Component {}
// @ts-ignore
Component[$class] = Component.prototype[$class] = null
