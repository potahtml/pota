// recursion budget
//
// Self-referential type helpers (`Accessed`, `Resolved`, `ResolvedDeep`)
// would instantiate forever when given a broad union like `JSX.Element`
// (which contains `(() => Element)` and `Element[]`). They carry a
// depth budget `D` and stop expanding once it reaches the limit; the
// remaining type is left as-is. Centralising these three aliases means
// the tuple shape, the increment, and the limit live in one place.

type Budget = 0[]
type Bump<D extends Budget> = [0, ...D]
type AtLimit<D extends Budget> = D['length'] extends 50 ? true : false

// accessor

type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

type Accessed<T, D extends Budget = []> =
	AtLimit<D> extends true
		? T
		: T extends PromiseLike<infer R>
			? Accessed<R, Bump<D>>
			: T extends Derived<infer R>
				? Accessed<R, Bump<D>>
				: T extends DerivedSignal<infer R>
					? Accessed<R, Bump<D>>
					: T extends SignalAccessor<infer R>
						? Accessed<R, Bump<D>>
						: T extends SignalFunction<infer R>
							? Accessed<R, Bump<D>>
							: T extends { (): infer R }
								? Accessed<R, Bump<D>>
								: T

type Attribute<T> =
	| (() => Attribute<T>)
	| PromiseLike<Attribute<T>>
	| SignalAccessor<T>
	| T

/**
 * Result of recursively invoking functions and flattening nested
 * arrays — mirrors the runtime behavior of `unwrap`/`resolve`.
 */
type Resolved<T, D extends Budget = []> =
	AtLimit<D> extends true
		? T
		: T extends readonly (infer U)[]
			? Array<ResolvedDeep<U, Bump<D>>>
			: T extends () => infer R
				? Resolved<R, Bump<D>>
				: T

type ResolvedDeep<T, D extends Budget = []> =
	AtLimit<D> extends true
		? T
		: T extends readonly (infer U)[]
			? ResolvedDeep<U, Bump<D>>
			: T extends () => infer R
				? ResolvedDeep<R, Bump<D>>
				: T

// dom

type DOMElement = HTMLElement | SVGElement | MathMLElement

// signal

type SignalAccessor<T> = () => T

/**
 * Replaces the signal value as-is — does **not** receive the previous
 * value. To compute from the previous value, use `SignalUpdate<T>`.
 */
type SignalSetter<T> = (newValue?: T) => SignalChanged

type SignalUpdate<T> = (
	updateFunction: (prevValue: T) => T,
) => SignalChanged

// signal as object/function

type Signal<T> = {
	readonly read: SignalAccessor<T>
	readonly write: SignalSetter<T>
	readonly update: SignalUpdate<T>
}

interface SignalFunction<T> {
	(value: T): SignalChanged
	(): T
}

// signal properties

type SignalOptions<T> =
	| {
			equals?: false | ((a: T, b: T) => boolean)
	  }
	| undefined

type SignalChanged = boolean

// effect / root / on / syncEffect

/**
 * Options accepted by `effect`, `syncEffect`, `root`, and `on`.
 * Currently accepts no user-facing fields; the runtime passes the
 * object to the underlying `Computation` base class. Typed with
 * `Record<string, never>` (not `{}`) to reject arbitrary properties —
 * prevents accidental overrides of internal `Computation` fields like
 * `state`, `fn`, or `updatedAt` while leaving a named anchor for
 * future options.
 */
type EffectOptions = undefined | Record<string, never>

// derived

type DerivedSignal<R> = {
	(value: R | (() => R) | PromiseLike<R>): SignalChanged
	(): R
	resolved: SignalAccessor<boolean>
}

type Derived<R> = DerivedSignal<R> & PromiseLike<DerivedSignal<R>>

// props

type When<T> = Accessor<T>
type Each<T> = Accessor<Iterable<T>>

// the matched part of a `when` value handed to a `Show`/`Match`
// render-prop child. The branch runs only when `when` is truthy, so
// the no-match sentinels (`false`/`null`/`undefined`) are removed —
// but genuine values stay, including the falsy literals `0`/`''`/`0n`
// (a numeric `when` still hands the child a number)
type Matched<T> = Exclude<T, false | null | undefined>

// tests

type Expect = {
	toBe: (expected: unknown) => Promise<unknown>
	toEqual: (expected: unknown) => Promise<unknown>
	toInclude: (expected: unknown) => Promise<unknown>
	toThrow: (expected: unknown) => Promise<unknown>
	toMatch: (expected: unknown) => Promise<unknown>
	not: {
		toBe: (expected: unknown) => Promise<unknown>
		toEqual: (expected: unknown) => Promise<unknown>
		toInclude: (expected: unknown) => Promise<unknown>
		toThrow: (expected: unknown) => Promise<unknown>
		toMatch: (expected: unknown) => Promise<unknown>
	}
}

// utils

type Merge<A, B> = Omit<A, keyof B> & B
