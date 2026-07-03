/**
 * Development-mode flag. Off by default so production paths skip
 * dev-only guards (`freeze(props)` on component creation). Live
 * binding — read it at use time, not import time.
 *
 * Enabled by importing `pota/dev`, or automatically by
 * `pota/jsx-dev-runtime` (bundlers select the dev runtime in
 * development builds).
 */
export let DEV = false

/** Turns on development mode. */
export const enableDev = () => {
	DEV = true
}
