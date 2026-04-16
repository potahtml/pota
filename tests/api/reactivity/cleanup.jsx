/** @jsxImportSource pota */

// Tests for `cleanup()` — registering disposal callbacks on the
// current owner. Covers: basic behavior, execution order, component
// scope unmount, untracked context, error routing through catchError.

import { test, body, microtask } from '#test'
import {
	cleanup,
	catchError,
	signal,
	effect,
	memo,
	syncEffect,
	root,
	render,
} from 'pota'

await test('cleanup - multiple callbacks run in LIFO order on dispose', expect => {
	const seen = []

	const dispose = root(d => {
		cleanup(() => seen.push('first'))
		cleanup(() => seen.push('second'))
		cleanup(() => seen.push('third'))
		return d
	})

	dispose()

	expect(seen).toEqual(['third', 'second', 'first'])
})

await test('cleanup - runs when a component scope is unmounted', expect => {
	const seen = []

	function Component() {
		cleanup(() => seen.push('cleaned'))
		return <p>content</p>
	}

	const dispose = render(Component)

	expect(body()).toBe('<p>content</p>')
	expect(seen).toEqual([])

	dispose()

	expect(seen).toEqual(['cleaned'])
})

// --- cleanup order inside effect ---------------------------------------------

await test('cleanup - multiple cleanups inside single effect run in reverse', expect => {
	const trigger = signal(0)
	const order = []

	const dispose = root(d => {
		effect(() => {
			trigger.read()
			cleanup(() => order.push('a'))
			cleanup(() => order.push('b'))
			cleanup(() => order.push('c'))
		})
		return d
	})

	expect(order).toEqual([])

	trigger.write(1)
	expect(order).toEqual(['c', 'b', 'a'])

	dispose()
})

// --- cleanup runs exactly once per disposal --------------------------

await test('cleanup - single cleanup fires exactly once on disposal', expect => {
	const calls = []

	const dispose = root(d => {
		cleanup(() => calls.push('cleanup'))
		return d
	})

	expect(calls).toEqual([])

	dispose()
	expect(calls).toEqual(['cleanup'])

	// calling dispose again is a no-op for cleanup
	dispose()
	expect(calls).toEqual(['cleanup'])
})

// --- untrack inside a cleanup has no effect -------------------------

await test('cleanup - runs in its own untracked context', expect => {
	const count = signal(0)
	const other = signal(100)
	const seen = []
	let runs = 0

	const dispose = root(d => {
		syncEffect(() => {
			runs++
			count.read()
			cleanup(() => {
				// cleanup fires before the next effect run (and on
				// dispose). It reads the latest committed value of
				// `count`, plus `other` — a signal the parent never
				// tracked. Reading `other` inside cleanup must NOT
				// subscribe the parent effect, otherwise writing to
				// `other` below would force another run.
				seen.push([count.read(), other.read()])
			})
		})
		return d
	})

	expect(runs).toBe(1)
	expect(seen).toEqual([])

	// triggering the effect — the previous cleanup fires first, and
	// reads the post-write values that are live at that moment
	count.write(1)
	expect(runs).toBe(2)
	expect(seen).toEqual([[1, 100]])

	// proof the cleanup's read of `other` did not subscribe the parent
	other.write(200)
	expect(runs).toBe(2)
	expect(seen).toEqual([[1, 100]])

	dispose()
	// dispose runs the final cleanup with the current committed values
	expect(seen).toEqual([
		[1, 100],
		[1, 200],
	])
})

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
	/** @type {any} */
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
	/** @type {any} */
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
	/** @type {any} */
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
	/** @type {any} */
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
			err => errors.push(/** @type {Error} */ (err).message),
		)
		return dispose
	})
	dispose()

	// reverse order: c, b, a — all three routed
	expect(errors).toEqual(['c', 'b', 'a'])
})

await test('cleanup — error during memo re-evaluation is caught', expect => {
	/** @type {any} */
	let caught
	const [read, write] = signal(0)
	/** @type {any} */
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
			err => errors.push(/** @type {Error} */ (err).message),
		)
	})
	// both errors are routed: the cleanup error during
	// disposeOwned AND the original sync throw
	expect(errors.includes('owned cleanup')).toBe(true)
	expect(errors.includes('sync throw')).toBe(true)
})

await test('cleanup — runs before the next effect invocation, not after', async expect => {
	const trigger = signal(0)
	const order = []

	const disposeRoot = root(dispose => {
		effect(() => {
			order.push('effect:' + trigger.read())
			cleanup(() => {
				order.push('cleanup:' + trigger.read())
			})
		})
		return dispose
	})

	// effect is deferred (not sync), wait one macrotask
	await microtask()
	await microtask()

	order.length = 0 // ignore initial run timing differences

	trigger.write(1)
	await microtask()
	await microtask()

	// after the run: cleanup from previous run, then the new run
	expect(order[0]).toBe('cleanup:1')
	expect(order[1]).toBe('effect:1')

	disposeRoot()
})

await test('cleanup - nested effects clean up in reverse creation order', async expect => {
	const order = []

	const dispose = root(d => {
		effect(() => {
			cleanup(() => order.push('outer'))
			effect(() => {
				cleanup(() => order.push('inner'))
			})
		})
		return d
	})

	await microtask()
	await microtask()

	dispose()

	// inner cleanup fires before outer
	expect(order).toEqual(['inner', 'outer'])
})
