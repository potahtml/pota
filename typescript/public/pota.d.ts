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
 */
type Resolved<T> = T extends readonly (infer U)[]
	? Array<ResolvedDeep<U>>
	: T extends () => infer R
		? Resolved<R>
		: T

type ResolvedDeep<T> = T extends readonly (infer U)[]
	? ResolvedDeep<U>
	: T extends () => infer R
		? ResolvedDeep<R>
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
	(value: R): SignalChanged // setter
	(): R // getter
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
