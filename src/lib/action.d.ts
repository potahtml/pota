import { Accessed } from '../../typescript/pota.js'

export declare function action<A extends any[]>(
	f1: (...args: A) => void,
): (...args: A) => void

export declare function action<A extends any[], B>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C, D>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C, D, E>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C, D, E, F>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C, D, E, F, G>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => void,
): (...args: A) => void

export declare function action<A extends any[], B, C, D, E, F, G, H>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => void,
): (...args: A) => void

export declare function action<
	A extends any[],
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
>(
	f1: (...args: A) => B,
	f2: (a: Accessed<B>) => C,
	f3: (a: Accessed<C>) => D,
	f4: (a: Accessed<D>) => E,
	f5: (a: Accessed<E>) => F,
	f6: (a: Accessed<F>) => G,
	f7: (a: Accessed<G>) => H,
	f8: (a: Accessed<H>) => I,
	f9: (a: Accessed<I>) => void,
): (...args: A) => void

export declare function action<
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
	f10: (a: Accessed<J>) => void,
): (...args: A) => void

export declare function action<
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
	f11: (a: Accessed<K>) => void,
): (...args: A) => void
