/** @jsxImportSource pota */

// Tests for `catchError(fn, handler)` — the reactive error boundary
// primitive. Tests the context-based error routing: sync throws,
// reactive throws (effect, memo, derived), nesting, siblings,
// cleanup, and fallback to console.error when no handler exists.

import { test, sleep } from '#test'
import {
	catchError,
	signal,
	effect,
	memo,
	derived,
	root,
	cleanup,
	batch,
	owned,
	untrack,
} from 'pota'

// --- basic: fn runs normally -----------------------------------------

await test('catchError — fn runs and returns its value', expect => {
	const result = root(() =>
		catchError(
			() => 42,
			() => {},
		),
	)
	expect(result).toBe(42)
})

await test('catchError — fn with no error, handler is never called', expect => {
	let handlerCalled = false
	root(() =>
		catchError(
			() => 'ok',
			() => {
				handlerCalled = true
			},
		),
	)
	expect(handlerCalled).toBe(false)
})

// --- sync throw ------------------------------------------------------

await test('catchError — catches sync throw', expect => {
	/** @type {any} */ let caught
	root(() =>
		catchError(
			() => {
				throw new Error('sync boom')
			},
			err => {
				caught = err
			},
		),
	)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('sync boom')
})

await test('catchError — catches non-Error thrown values', expect => {
	/** @type {any} */ let caught
	root(() =>
		catchError(
			() => {
				throw 'a plain string'
			},
			err => {
				caught = err
			},
		),
	)
	expect(caught).toBe('a plain string')
})

await test('catchError — returns undefined when fn throws', expect => {
	const result = root(() =>
		catchError(
			() => {
				throw new Error('boom')
			},
			() => {},
		),
	)
	expect(result).toBe(undefined)
})

// --- reactive throw: effect ------------------------------------------

await test('catchError — catches error thrown inside an effect', expect => {
	/** @type {any} */ let caught
	root(() => {
		catchError(
			() => {
				effect(() => {
					throw new Error('effect boom')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('effect boom')
})

await test('catchError — catches effect error triggered by signal change', expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				effect(() => {
					if (read() === 1) throw new Error('triggered')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught).toBe(undefined)

	write(1)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('triggered')
})

await test('catchError — after an effect throws, it is dead and does not re-trigger', expect => {
	const errors = []
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				effect(() => {
					const v = read()
					if (v > 0) throw new Error('err-' + v)
				})
			},
			err => errors.push(/** @type {Error} */ (err).message),
		)
	})
	expect(errors.length).toBe(0)

	write(1)
	expect(errors).toEqual(['err-1'])

	// effect is dead after first throw — no new error
	write(2)
	expect(errors).toEqual(['err-1'])
})

// --- reactive throw: memo --------------------------------------------

await test('catchError — catches error thrown inside a memo', expect => {
	/** @type {any} */ let caught
	root(() => {
		catchError(
			() => {
				const m = memo(() => {
					throw new Error('memo boom')
				})
				m() // trigger lazy evaluation
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('memo boom')
})

await test('catchError — catches memo error triggered by signal change', expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(0)
	/** @type {any} */ let m
	root(() => {
		catchError(
			() => {
				m = memo(() => {
					if (read() === 1) throw new Error('memo triggered')
					return read()
				})
				m() // initial read, no error
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught).toBe(undefined)
	expect(m()).toBe(0)

	write(1)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('memo triggered')
})

// --- reactive throw: derived -----------------------------------------

await test('catchError — catches error thrown inside a derived', expect => {
	/** @type {any} */ let caught
	root(() => {
		catchError(
			() => {
				const d = derived(() => {
					throw new Error('derived boom')
				})
				d() // trigger
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('derived boom')
})

await test('catchError — catches derived chain error on signal change', expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(1)
	root(() => {
		catchError(
			() => {
				const d = derived(
					() => read(),
					v => {
						if (v === 2) throw new Error('chain stage boom')
						return v * 10
					},
				)
				d() // initial, no error
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught).toBe(undefined)

	write(2)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('chain stage boom')
})

// --- nesting ---------------------------------------------------------

await test('catchError — nested: inner catches before outer', expect => {
	/** @type {any} */ let outerCaught, /** @type {any} */ innerCaught
	root(() => {
		catchError(
			() => {
				catchError(
					() => {
						throw new Error('nested')
					},
					err => {
						innerCaught = err
					},
				)
			},
			err => {
				outerCaught = err
			},
		)
	})
	expect(innerCaught instanceof Error).toBe(true)
	expect(innerCaught.message).toBe('nested')
	expect(outerCaught).toBe(undefined)
})

await test('catchError — nested: inner catches reactive error before outer', expect => {
	/** @type {any} */ let outerCaught, /** @type {any} */ innerCaught
	const [read, write] = signal(0)

	root(() => {
		catchError(
			() => {
				catchError(
					() => {
						effect(() => {
							if (read() === 1) throw new Error('inner reactive')
						})
					},
					err => {
						innerCaught = err
					},
				)
			},
			err => {
				outerCaught = err
			},
		)
	})

	write(1)
	expect(innerCaught instanceof Error).toBe(true)
	expect(innerCaught.message).toBe('inner reactive')
	expect(outerCaught).toBe(undefined)
})

await test('catchError — deeply nested: error reaches innermost handler', expect => {
	const caught = []
	root(() => {
		catchError(
			() => {
				catchError(
					() => {
						catchError(
							() => {
								throw new Error('deep')
							},
							err =>
								caught.push(
									'C:' + /** @type {Error} */ (err).message,
								),
						)
					},
					err =>
						caught.push('B:' + /** @type {Error} */ (err).message),
				)
			},
			err => caught.push('A:' + /** @type {Error} */ (err).message),
		)
	})
	expect(caught).toEqual(['C:deep'])
})

// --- siblings --------------------------------------------------------

await test('catchError — sibling scopes catch independently', expect => {
	/** @type {any} */ let caughtA, /** @type {any} */ caughtB
	root(() => {
		catchError(
			() => {
				throw new Error('A')
			},
			err => {
				caughtA = /** @type {Error} */ (err).message
			},
		)
		catchError(
			() => {
				throw new Error('B')
			},
			err => {
				caughtB = /** @type {Error} */ (err).message
			},
		)
	})
	expect(caughtA).toBe('A')
	expect(caughtB).toBe('B')
})

await test('catchError — sibling reactive errors stay isolated', expect => {
	/** @type {any} */ let caughtA, /** @type {any} */ caughtB
	const [readA, writeA] = signal(0)
	const [readB, writeB] = signal(0)

	root(() => {
		catchError(
			() => {
				effect(() => {
					if (readA() === 1) throw new Error('A')
				})
			},
			err => {
				caughtA = /** @type {Error} */ (err).message
			},
		)
		catchError(
			() => {
				effect(() => {
					if (readB() === 1) throw new Error('B')
				})
			},
			err => {
				caughtB = /** @type {Error} */ (err).message
			},
		)
	})

	writeA(1)
	expect(caughtA).toBe('A')
	expect(caughtB).toBe(undefined)

	writeB(1)
	expect(caughtB).toBe('B')
})

// --- no handler: console.error fallback ------------------------------

await test('catchError — unhandled effect error goes to console.error', expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		effect(() => {
			throw new Error('unhandled')
		})
	})

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('unhandled')
	console.error = original
})

await test('catchError — unhandled memo error goes to console.error', expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		const m = memo(() => {
			throw new Error('unhandled memo')
		})
		m()
	})

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('unhandled memo')
	console.error = original
})

// --- error does not break siblings outside scope ---------------------

await test('catchError — error does not break sibling effects outside scope', expect => {
	let siblingRan = false
	root(() => {
		catchError(
			() => {
				effect(() => {
					throw new Error('boom')
				})
			},
			() => {},
		)
		effect(() => {
			siblingRan = true
		})
	})
	expect(siblingRan).toBe(true)
})

await test('catchError — error does not break sibling signal tracking', expect => {
	const [read, write] = signal(0)
	let seen = []

	root(() => {
		catchError(
			() => {
				effect(() => {
					throw new Error('boom')
				})
			},
			() => {},
		)
		effect(() => {
			seen.push(read())
		})
	})
	expect(seen).toEqual([0])

	write(1)
	write(2)
	expect(seen).toEqual([0, 1, 2])
})

// --- cleanup ---------------------------------------------------------

await test('catchError — cleanups inside scope run on disposal', expect => {
	let cleaned = false
	const dispose = root(dispose => {
		catchError(
			() => {
				cleanup(() => {
					cleaned = true
				})
			},
			() => {},
		)
		return dispose
	})
	expect(cleaned).toBe(false)
	dispose()
	expect(cleaned).toBe(true)
})

await test('catchError — cleanup registered before sync throw runs on disposal', expect => {
	let cleanupRan = 0
	const dispose = root(dispose => {
		catchError(
			() => {
				// cleanup registered directly on the catchError scope
				cleanup(() => cleanupRan++)
				throw new Error('after cleanup')
			},
			() => {},
		)
		return dispose
	})
	expect(cleanupRan).toBe(0)
	dispose()
	expect(cleanupRan).toBe(1)
})

// --- handler can write to signals ------------------------------------

await test('catchError — handler can write to signals', expect => {
	const [read, write] = signal('initial')
	root(() => {
		catchError(
			() => {
				throw new Error('boom')
			},
			() => {
				write('caught')
			},
		)
	})
	expect(read()).toBe('caught')
})

// --- root() inside catchError inherits handler -----------------------

await test('catchError — root() inside scope inherits error handler', expect => {
	/** @type {any} */ let caught
	root(() => {
		catchError(
			() => {
				root(() => {
					effect(() => {
						throw new Error('from inner root')
					})
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('from inner root')
})

// --- batch -----------------------------------------------------------

await test('catchError — error inside batch is caught', expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				effect(() => {
					if (read() > 0) throw new Error('batched')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught).toBe(undefined)

	batch(() => {
		write(1)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('batched')
})

// --- mixed: some children throw, some don't --------------------------

await test('catchError — only throwing child triggers handler, sibling effects survive', expect => {
	/** @type {any} */ let caught
	let siblingValue = 0
	const [read, write] = signal(0)

	root(() => {
		catchError(
			() => {
				effect(() => {
					if (read() === 1) throw new Error('one throws')
				})
				effect(() => {
					siblingValue = read()
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(siblingValue).toBe(0)
	expect(caught).toBe(undefined)

	write(1)
	expect(caught.message).toBe('one throws')
	expect(siblingValue).toBe(1)
})

// --- runWithOwner: owned callback errors -----------------------------
//
// `owned` captures the current Owner and later calls
// `runWithOwner(o, cb)`. The try/catch in `runWithOwner` catches
// errors from deferred callbacks (promise .then, event handlers)
// and routes them via the captured owner's context.

await test('owned — error in callback is caught by catchError handler', expect => {
	/** @type {any} */ let caught
	/** @type {any} */ let ownedFn
	root(() => {
		catchError(
			() => {
				ownedFn = owned(() => {
					throw new Error('owned boom')
				})
			},
			err => {
				caught = err
			},
		)
	})
	// call after root returns — simulates async/event callback
	ownedFn()
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('owned boom')
})

await test('owned — disposed callback does not run or route', expect => {
	/** @type {any} */ let caught
	/** @type {any} */ let ownedFn
	const dispose = root(dispose => {
		catchError(
			() => {
				ownedFn = owned(() => {
					throw new Error('should not run')
				})
			},
			err => {
				caught = err
			},
		)
		return dispose
	})
	dispose() // dispose the owner
	ownedFn() // should be a no-op
	expect(caught).toBe(undefined)
})

// --- runWithOwner: root() errors -------------------------------------
//
// `root(fn)` calls `runWithOwner(root, fn)`. Errors in fn are
// caught by runWithOwner and routed via the root's inherited
// context — the root inherits context from its parent, so an
// error boundary above root() catches the error.

await test('root — throw inside root is caught by outer catchError', expect => {
	/** @type {any} */ let caught
	root(() => {
		catchError(
			() => {
				root(() => {
					throw new Error('root boom')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('root boom')
})

// --- handler error escalation ----------------------------------------
//
// When the handler passed to `catchError` itself throws, the error
// must NOT re-enter the same handler — it must escalate to the
// parent handler (or console.error if none).

await test('catchError — handler error is not caught by same handler', expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	let handlerCalls = 0
	root(() => {
		catchError(
			() => {
				throw new Error('boom')
			},
			err => {
				handlerCalls++
				throw new Error('handler broke')
			},
		)
	})
	// handler called once with original error, not re-entered
	expect(handlerCalls).toBe(1)
	// handler error went to console.error (no parent)
	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('handler broke')
	console.error = original
})

await test('catchError — handler error escalates to parent handler', expect => {
	/** @type {any} */ let outerCaught
	root(() => {
		catchError(
			() => {
				catchError(
					() => {
						throw new Error('child')
					},
					err => {
						throw new Error('inner handler broke')
					},
				)
			},
			err => {
				outerCaught = err
			},
		)
	})
	expect(outerCaught instanceof Error).toBe(true)
	expect(outerCaught.message).toBe('inner handler broke')
})

await test('catchError — reactive handler error escalates to parent', expect => {
	/** @type {any} */ let outerCaught
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				catchError(
					() => {
						effect(() => {
							if (read() === 1) throw new Error('child reactive')
						})
					},
					err => {
						throw new Error(
							'handler broke on: ' +
								/** @type {Error} */ (err).message,
						)
					},
				)
			},
			err => {
				outerCaught = err
			},
		)
	})
	expect(outerCaught).toBe(undefined)

	write(1)
	expect(outerCaught instanceof Error).toBe(true)
	expect(outerCaught.message).toBe('handler broke on: child reactive')
})

// --- abort semantics: untrack ----------------------------------------
//
// Errors thrown inside `untrack()` propagate through `runWith`
// (which does NOT catch) back to the caller. When untrack is
// called from inside an effect, the error reaches the effect's
// update() catch block, which aborts the fn — code after the
// untrack call does NOT run.
//
// This is why `runWith` must NOT catch: it would swallow the
// error at the wrong level and let the fn continue in a broken
// state.

await test('untrack — throw inside untrack aborts the effect fn', expect => {
	/** @type {any} */ let caught
	let afterUntrack = false
	root(() => {
		catchError(
			() => {
				effect(() => {
					untrack(() => {
						throw new Error('in untrack')
					})
					afterUntrack = true // must NOT run
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('in untrack')
	expect(afterUntrack).toBe(false)
})

await test('untrack — throw inside untrack in a memo aborts the memo fn', expect => {
	/** @type {any} */ let caught
	let afterUntrack = false
	root(() => {
		catchError(
			() => {
				const m = memo(() => {
					untrack(() => {
						throw new Error('memo untrack')
					})
					afterUntrack = true
					return 42
				})
				m()
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('memo untrack')
	expect(afterUntrack).toBe(false)
})

// --- update() cleanup on error ---------------------------------------
//
// When an effect/memo/derived throws during update(), the catch
// block marks state=STALE, calls disposeOwned() to tear down
// partial children, and bumps updatedAt to prevent immediate
// re-runs. These tests verify that cleanup contract.

await test('effect — thrown effect is marked dead and does not re-run', expect => {
	let runs = 0
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				effect(() => {
					runs++
					if (read() === 1) throw new Error('die')
				})
			},
			() => {},
		)
	})
	expect(runs).toBe(1)

	write(1) // effect throws and dies
	expect(runs).toBe(2)

	write(2) // effect is dead, should NOT re-run
	expect(runs).toBe(2)
})

await test('effect — partial children created before throw are disposed', expect => {
	let childDisposed = false
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				effect(() => {
					// create a child effect before conditionally throwing
					effect(() => {
						cleanup(() => {
							childDisposed = true
						})
					})
					if (read() === 1) throw new Error('parent throws')
				})
			},
			() => {},
		)
	})
	expect(childDisposed).toBe(false)

	write(1) // parent effect throws — disposeOwned cleans up child
	expect(childDisposed).toBe(true)
})

await test('memo — thrown memo does not write its value', expect => {
	const [read, write] = signal(0)
	/** @type {any} */ let m
	root(() => {
		catchError(
			() => {
				m = memo(() => {
					const v = read()
					if (v === 1) throw new Error('bad')
					return v * 10
				})
				m()
			},
			() => {},
		)
	})
	expect(m()).toBe(0)

	write(1) // memo throws — value stays at 0, not updated
	expect(m()).toBe(0)
})

// --- parent/sibling state preservation -------------------------------
//
// When a child inside a catchError scope throws, the parent's
// own reactive state (effects, memos, signals) must continue
// working. The error is scoped — it should not corrupt tracking
// for anything outside the errored computation.

await test('parent effect keeps tracking after child error', expect => {
	const [read, write] = signal(0)
	const parentSeen = []
	/** @type {any} */ let caught

	root(() => {
		// parent's own effect — tracks `read`
		effect(() => {
			parentSeen.push(read())
		})

		catchError(
			() => {
				effect(() => {
					if (read() === 2) throw new Error('child')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(parentSeen).toEqual([0])

	write(1) // both effects run, no error
	expect(parentSeen).toEqual([0, 1])

	write(2) // child throws, parent should still track
	expect(caught.message).toBe('child')
	expect(parentSeen).toEqual([0, 1, 2])

	write(3) // child is dead, parent still alive
	expect(parentSeen).toEqual([0, 1, 2, 3])
})

await test('parent memo keeps producing values after child error', expect => {
	const [read, write] = signal(1)
	/** @type {any} */ let caught
	/** @type {any} */ let parentMemo

	root(() => {
		parentMemo = memo(() => read() * 100)

		catchError(
			() => {
				effect(() => {
					if (read() === 2) throw new Error('child')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(parentMemo()).toBe(100)

	write(2) // child throws
	expect(caught.message).toBe('child')
	expect(parentMemo()).toBe(200) // parent memo still works

	write(3) // child dead, parent still live
	expect(parentMemo()).toBe(300)
})

await test('sibling catchError scopes preserve independent reactive state', expect => {
	const [readA, writeA] = signal(0)
	const [readB, writeB] = signal(0)
	/** @type {any} */ let caughtA
	const seenB = []

	root(() => {
		catchError(
			() => {
				effect(() => {
					if (readA() === 1) throw new Error('A dies')
				})
			},
			err => {
				caughtA = err
			},
		)
		catchError(
			() => {
				effect(() => {
					seenB.push(readB())
				})
			},
			() => {},
		)
	})
	expect(seenB).toEqual([0])

	writeA(1) // scope A errors
	expect(caughtA.message).toBe('A dies')

	writeB(1) // scope B must still track
	writeB(2)
	expect(seenB).toEqual([0, 1, 2])
})

await test('parent derived keeps working after child error', expect => {
	const [read, write] = signal(1)
	/** @type {any} */ let caught

	const d = root(() => {
		const d = derived(() => read() * 10)

		catchError(
			() => {
				effect(() => {
					if (read() === 3) throw new Error('child')
				})
			},
			err => {
				caught = err
			},
		)

		return d
	})
	expect(d()).toBe(10)

	write(2)
	expect(d()).toBe(20)

	write(3) // child throws
	expect(caught.message).toBe('child')
	expect(d()).toBe(30) // parent derived still works

	write(4)
	expect(d()).toBe(40)
})

// --- promise rejection -----------------------------------------------
//
// Promise rejection tests live in `tests/api/promise-rejection.jsx`
// (async tests need sleep/await for the rejection to propagate).

// --- catchError inside an effect -------------------------------------

await test('catchError — works when nested inside an effect', expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(0)
	root(() => {
		effect(() => {
			// read the signal HERE so the effect tracks it;
			// catchError's fn uses untrack, so reads inside
			// fn won't cause the effect to re-run
			const v = read()
			catchError(
				() => {
					if (v === 1) throw new Error('inner')
				},
				err => {
					caught = err
				},
			)
		})
	})
	expect(caught).toBe(undefined)

	write(1)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('inner')
})

// --- multiple boundaries sharing a signal ----------------------------

await test('catchError — two boundaries triggered by same signal catch independently', expect => {
	/** @type {any} */ let caughtA, /** @type {any} */ caughtB
	const [read, write] = signal(0)

	root(() => {
		catchError(
			() => {
				effect(() => {
					if (read() === 1) throw new Error('A')
				})
			},
			err => {
				caughtA = err
			},
		)
		catchError(
			() => {
				effect(() => {
					if (read() === 1) throw new Error('B')
				})
			},
			err => {
				caughtB = err
			},
		)
	})
	expect(caughtA).toBe(undefined)
	expect(caughtB).toBe(undefined)

	write(1) // both effects throw on same signal change
	expect(caughtA.message).toBe('A')
	expect(caughtB.message).toBe('B')
})

// --- error after async resolution ------------------------------------

await test('catchError — error triggered after promise resolution is caught', async expect => {
	/** @type {any} */ let caught
	const [read, write] = signal(0)
	root(() => {
		catchError(
			() => {
				// effect that reads a signal — will throw when
				// signal changes AFTER the promise resolved
				effect(() => {
					if (read() === 1) throw new Error('post-async')
				})
			},
			err => {
				caught = err
			},
		)
	})
	expect(caught).toBe(undefined)

	// simulate async work completing, then signal change triggers error
	await new Promise(r => setTimeout(r, 10))
	write(1)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('post-async')
})

// --- Promise rejection routing ---------------------------------------
//
// `withValue` chains `.then(onFulfilled, onRejected)` — rejected
// promises inside a catchError scope route to the error handler via
// `owned` → `runWithOwner` → `routeError`.

await test('catchError — catches rejected promise in derived', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const d = derived(() => Promise.reject(new Error('rejected')))
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('rejected')
})

await test('catchError — catches non-Error rejected value', async expect => {
	/** @type {any} */
	let caught
	root(() => {
		catchError(
			() => {
				const d = derived(() => Promise.reject('plain string'))
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught).toBe('plain string')
})

await test('catchError — catches rejected promise via signal change', async expect => {
	/** @type {any} */
	let caught
	const [read, write] = signal(false)
	root(() => {
		catchError(
			() => {
				const d = derived(() =>
					read() ? Promise.reject(new Error('later')) : 'ok',
				)
				d()
			},
			err => {
				caught = err
			},
		)
	})

	await sleep(50)
	expect(caught).toBe(undefined) // no rejection yet

	write(true) // now derived returns a rejecting promise
	await sleep(50)
	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('later')
})

await test('catchError — rejection does not break sibling effects', async expect => {
	/** @type {any} */
	let caught
	const seen = []
	const [read, write] = signal(0)

	root(() => {
		catchError(
			() => {
				const d = derived(() => Promise.reject(new Error('boom')))
				d()
			},
			err => {
				caught = err
			},
		)
		// sibling effect
		effect(() => {
			seen.push(read())
		})
	})

	await sleep(50)
	expect(caught.message).toBe('boom')
	expect(seen).toEqual([0])

	write(1)
	expect(seen).toEqual([0, 1])
})

await test('catchError — rejection without handler goes to console.error', async expect => {
	const original = console.error
	/** @type {any} */
	let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		const d = derived(() => Promise.reject(new Error('no handler')))
		d()
	})

	await sleep(50)
	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('no handler')
	console.error = original
})

await test('catchError — thrown error in one effect does not break other effects (no handler)', expect => {
	const trigger = signal(0)
	const seen = []
	const originalError = console.error
	console.error = () => {}

	const dispose = root(d => {
		effect(() => {
			if (trigger.read() === 1) throw new Error('boom')
		})
		effect(() => {
			seen.push('ok:' + trigger.read())
		})
		return d
	})

	// baseline: both effects ran without error
	expect(seen).toInclude('ok:0')

	trigger.write(1)

	// second effect should still have run despite first throwing
	expect(seen).toInclude('ok:1')

	console.error = originalError
	dispose()
})
