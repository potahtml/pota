/**
 * Development JSX runtime — same surface as `pota/jsx-runtime`, but
 * importing it turns on development mode. Bundlers pick this entry
 * automatically in development builds (`jsx: 'automatic'` +
 * `development: true`), so dev-only guards come on with zero
 * configuration and production builds stay on the fast runtime.
 */
import { enableDev } from '../lib/dev.js'

enableDev()

export * from './jsx-runtime.js'
