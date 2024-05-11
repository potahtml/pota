import { empty } from './empty.js'
import { freeze } from './freeze.js'

/** An empty frozen object */
export const nothing = freeze(empty())
