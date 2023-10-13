import { untrack } from '#primitives'
import { Scheduler } from '#time'

// constants

export const $meta = Symbol('meta')

// supported namespaces

export const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
	xlink: 'http://www.w3.org/1999/xlink',
}

// component are cached for the duration of a run (top to bottom)
// cache is cleared after the run
// if you make a list with 100 links in one shot
// it will reuse a component 99 times
// then discard that object
// performance opportunity: expiration could be smarter

export const Components = new Map()

// to ensure timing of events callbacks are queued to run at specific times

export const TIME_MOUNT = 1
export const TIME_READY = 2

// we need to ensure the timing of some callbacks, like `onMount`, and `onReady`
// for this we add 1 queueMicrotask, then we queue functions in an array at a `priority` position
// once the microtask is called, we run the array of functions in order of priority

export const Timing = new Scheduler(
	// callback
	untrack,
	// finally
	() => {
		// we are sure our job is done for this loop
		// this function runs after each "run" is complete
		// so we can add here house keeping stuff

		// clear the component cache
		Components.clear()
	},
)
