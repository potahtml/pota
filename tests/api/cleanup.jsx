/** @jsxImportSource pota */

// Tests for `cleanup()` — registering disposal callbacks on the
// current owner. Covers: basic behavior, execution order, errors
// inside cleanup functions (routed via routeError), and interaction
// with the error boundary system.

import { test } from '#test'
import {
	cleanup,
	catchError,
	signal,
	effect,
	memo,
	syncEffect,
	root,
} from 'pota'

// --- basic behavior --------------------------------------------------

await test('cleanup — runs on disposal', expect => {
	let ran = false
	const dispose = root(dispose => {
		cleanup(() => {
			ran = true
		})
		return dispose
	})
	expect(ran).toBe(false)
	dispose()
	expect(ran).toBe(true)
})

await test('cleanup — multiple cleanups run in reverse order', expect => {
	const order = []
	const dispose = root(dispose => {
		cleanup(() => order.push('a'))
		cleanup(() => order.push('b'))
		cleanup(() => order.push('c'))
		return dispose
	})
	dispose()
	expect(order).toEqual(['c', 'b', 'a'])
})

await test('cleanup — effect cleanup runs when effect re-runs', expect => {
	let cleanupCount = 0
	const [read, write] = signal(0)
	const dispose = root(dispose => {
		effect(() => {
			read()
			cleanup(() => cleanupCount++)
		})
		return dispose
	})
	// effect has run after root returns, cleanup registered but not called
	expect(cleanupCount).toBe(0)

	write(1) // effect re-runs, previous cleanup fires
	expect(cleanupCount).toBe(1)

	write(2)
	expect(cleanupCount).toBe(2)

	dispose() // final cleanup
	expect(cleanupCount).toBe(3)
})

await test('cleanup — returned by cleanup() for cancellation', expect => {
	let ran = false
	const dispose = root(dispose => {
		const fn = cleanup(() => {
			ran = true
		})
		expect(typeof fn).toBe('function')
		return dispose
	})
	dispose()
	expect(ran).toBe(true)
})

// --- errors in cleanup -----------------------------------------------

await test('cleanup — error routes to catchError handler', expect => {
	let caught
	const dispose = root(dispose => {
		catchError(
			() => {
				cleanup(() => {
					throw new Error('cleanup boom')
				})
			},
			err => {
				caught = err
			},
		)
		return dispose
	})
	expect(caught).toBe(undefined)

	dispose()
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('cleanup boom')
})

await test('cleanup — error without handler goes to console.error', expect => {
	const original = console.error
	let logged
	console.error = err => {
		logged = err
	}

	const dispose = root(dispose => {
		cleanup(() => {
			throw new Error('cleanup unhandled')
		})
		return dispose
	})
	dispose()

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('cleanup unhandled')
	console.error = original
})

await test('cleanup — remaining cleanups still run after one throws', expect => {
	const original = console.error
	console.error = () => {}

	const order = []
	const dispose = root(dispose => {
		cleanup(() => order.push('a'))
		cleanup(() => {
			throw new Error('b throws')
		})
		cleanup(() => order.push('c'))
		return dispose
	})
	dispose()

	// reverse order: c runs, b throws (caught), a runs
	expect(order).toEqual(['c', 'a'])

	console.error = original
})

await test('cleanup — error during effect re-run is caught', expect => {
	let caught
	const [read, write] = signal(0)
	root(dispose => {
		catchError(
			() => {
				effect(() => {
					read()
					cleanup(() => {
						if (read() === 1) throw new Error('cleanup on rerun')
					})
				})
			},
			err => {
				caught = err
			},
		)
		return dispose
	})
	expect(caught).toBe(undefined)

	write(1) // effect re-runs, old cleanup fires and throws
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('cleanup on rerun')
})

await test('cleanup — error does not prevent sibling effects from running', expect => {
	const original = console.error
	console.error = () => {}

	const [read, write] = signal(0)
	const seen = []

	root(dispose => {
		effect(() => {
			read()
			cleanup(() => {
				throw new Error('bad cleanup')
			})
		})

		// sibling effect
		effect(() => {
			seen.push(read())
		})
		return dispose
	})
	expect(seen).toEqual([0])

	write(1) // first effect's cleanup throws, sibling should still run
	expect(seen).toEqual([0, 1])

	write(2)
	expect(seen).toEqual([0, 1, 2])

	console.error = original
})

await test('cleanup — error in nested owned child is caught by handler', expect => {
	let caught
	const dispose = root(dispose => {
		catchError(
			() => {
				effect(() => {
					effect(() => {
						cleanup(() => {
							throw new Error('nested cleanup')
						})
					})
				})
			},
			err => {
				caught = err
			},
		)
		return dispose
	})

	expect(caught).toBe(undefined)
	dispose()
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('nested cleanup')
})

await test('cleanup — all cleanups throw, all errors are routed', expect => {
	const errors = []
	const dispose = root(dispose => {
		catchError(
			() => {
				cleanup(() => {
					throw new Error('a')
				})
				cleanup(() => {
					throw new Error('b')
				})
				cleanup(() => {
					throw new Error('c')
				})
			},
			err => errors.push(err.message),
		)
		return dispose
	})
	dispose()

	// reverse order: c, b, a — all three routed
	expect(errors).toEqual(['c', 'b', 'a'])
})

await test('cleanup — error during memo re-evaluation is caught', expect => {
	let caught
	const [read, write] = signal(0)
	let m
	root(dispose => {
		catchError(
			() => {
				m = memo(() => {
					read()
					cleanup(() => {
						if (read() === 1) throw new Error('memo cleanup')
					})
					return read() * 10
				})
				m() // initial evaluation
			},
			err => {
				caught = err
			},
		)
		return dispose
	})
	expect(caught).toBe(undefined)
	expect(m()).toBe(0)

	write(1) // memo re-evaluates, old cleanup throws
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('memo cleanup')
})

await test('cleanup — parent reactive state preserved after child cleanup error', expect => {
	const original = console.error
	console.error = () => {}

	const [read, write] = signal(0)
	const parentSeen = []

	root(dispose => {
		effect(() => {
			parentSeen.push(read())
		})

		catchError(
			() => {
				effect(() => {
					read()
					cleanup(() => {
						throw new Error('child cleanup')
					})
				})
			},
			() => {},
		)
		return dispose
	})
	expect(parentSeen).toEqual([0])

	write(1) // child cleanup throws, parent should keep tracking
	expect(parentSeen).toEqual([0, 1])

	write(2)
	expect(parentSeen).toEqual([0, 1, 2])

	console.error = original
})

await test('cleanup — effect stays alive after its cleanup threw', expect => {
	const original = console.error
	console.error = () => {}

	const [read, write] = signal(0)
	const seen = []

	root(dispose => {
		effect(() => {
			const v = read()
			seen.push(v)
			if (v === 0) {
				cleanup(() => {
					throw new Error('first cleanup')
				})
			}
		})
		return dispose
	})
	expect(seen).toEqual([0])

	// effect re-runs: old cleanup throws, but effect itself re-runs
	write(1)
	expect(seen).toEqual([0, 1])

	// effect is still alive
	write(2)
	expect(seen).toEqual([0, 1, 2])

	console.error = original
})

await test('cleanup — error when catchError disposes owned on sync throw', expect => {
	const errors = []
	root(() => {
		catchError(
			() => {
				// syncEffect runs inline, so cleanup IS registered
				// before the throw. catchError's catch calls
				// Owner.disposeOwned() which disposes this child,
				// triggering its throwing cleanup.
				syncEffect(() => {
					cleanup(() => {
						throw new Error('owned cleanup')
					})
				})
				throw new Error('sync throw')
			},
			err => errors.push(err.message),
		)
	})
	// both errors are routed: the cleanup error during
	// disposeOwned AND the original sync throw
	expect(errors.includes('owned cleanup')).toBe(true)
	expect(errors.includes('sync throw')).toBe(true)
})
