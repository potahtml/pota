// accessor

type Accessor<T> = (() => Accessor<T>) | SignalAccessor<T> | T

type Accessed<T> =
	T extends PromiseLike<infer R>
		? Accessed<R>
		: T extends Derived<infer R>
			? Accessed<R>
			: T extends DerivedSignal<infer R>
				? Accessed<R>
				: T extends SignalAccessor<infer R>
					? Accessed<R>
					: T extends SignalFunction<infer R>
						? Accessed<R>
						: T extends { (): infer R }
							? Accessed<R>
							: T

type Attribute<T> =
	| (() => Attribute<T>)
	| PromiseLike<Attribute<T>>
	| SignalAccessor<T>
	| T

/**
 * Result of recursively invoking functions and flattening nested
 * arrays — mirrors the runtime behavior of `unwrap`/`resolve`.
 *
 * `D` is a depth budget used to prevent infinite instantiation when a
 * broad union like `JSX.Element` (which includes `(() => Element)`
 * and `Element[]`) is passed in. Budget is generous enough for
 * realistic nesting; past it, the remaining type is left as-is.
 */
type Resolved<T, D extends 0[] = []> = D['length'] extends 5
	? T
	: T extends readonly (infer U)[]
		? Array<ResolvedDeep<U, [0, ...D]>>
		: T extends () => infer R
			? Resolved<R, [0, ...D]>
			: T

type ResolvedDeep<T, D extends 0[] = []> = D['length'] extends 5
	? T
	: T extends readonly (infer U)[]
		? ResolvedDeep<U, [0, ...D]>
		: T extends () => infer R
			? ResolvedDeep<R, [0, ...D]>
			: T

// dom

type DOMElement = HTMLElement | SVGElement | MathMLElement

// signal

type SignalAccessor<T> = () => T

type SignalSetter<T> = (newValue?: T) => SignalChanged

type SignalUpdate<T> = (
	updateFunction: (prevValue: T) => T,
) => SignalChanged

// signal as object/function/tuple

type SignalTuple<T> = readonly [
	SignalAccessor<T>,
	SignalSetter<T>,
	SignalUpdate<T>,
]

type SignalObject<T> = SignalTuple<T> & {
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
	run: Function
	resolved: SignalAccessor<boolean>
}

type Derived<R> = DerivedSignal<R> & PromiseLike<DerivedSignal<R>>

// props

type When<T> = Accessor<T>
type Each<T> = Accessor<Iterable<T>>

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
