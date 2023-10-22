import { $class } from '#constants'

/**
 * Extend `Component` and define a `render(props){}` method to create
 * a class component. `onReady(cb)` and `onCleanup(cb)` methods will
 * be registered automatically
 */
export class Component {}

Component[$class] = null
