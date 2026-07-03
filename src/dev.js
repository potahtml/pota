/**
 * Side-effect entry — `import 'pota/dev'` turns on development mode
 * (dev-only guards like frozen component props). Import it before
 * rendering; production builds simply omit the import.
 */
import { enableDev } from './lib/dev.js'

enableDev()
