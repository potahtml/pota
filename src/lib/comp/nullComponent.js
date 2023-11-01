import { markComponent } from './markComponent.js'

/**
 * As the component is marked as a `component`, then we wont add it on
 * an effect.
 *
 * @returns {Component}
 */
export const nullComponent = markComponent(() => null)
