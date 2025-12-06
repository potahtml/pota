import { Derived, Accessed } from '../../typescript/pota.js'

export declare function derived<A extends any[], R>(
	f1: (...args: A) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, C, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, C, D, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, C, D, E, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, C, D, E, F, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => R,
): Derived<Accessed<R>>

export declare function derived<A extends any[], B, C, D, E, F, G, R>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => R,
): Derived<Accessed<R>>

export declare function derived<
	A extends any[],
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	R,
>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => R,
): Derived<Accessed<R>>

export declare function derived<
	A extends any[],
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
	R,
>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => I,
	f9: (a: Accessed<I>) => R,
): Derived<Accessed<R>>

export declare function derived<
	A extends any[],
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
	J,
	R,
>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => I,
	f9: (a: Accessed<I>) => J,
	f10: (a: Accessed<J>) => R,
): Derived<Accessed<R>>

export declare function derived<
	A extends any[],
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
	J,
	K,
	R,
>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => I,
	f9: (a: Accessed<I>) => J,
	f10: (a: Accessed<J>) => K,
	f11: (a: Accessed<K>) => R,
): Derived<Accessed<R>>
