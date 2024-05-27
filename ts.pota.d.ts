/** Signatures are added via JSDoc. */

type Elements =
	| ((HTMLElement | Element | Node) & EventTarget)
	| null
	| undefined

// devTools

type devToolsArguments =
	| {
			__dev?: {
				__pota?: {
					kind?: string
					name?: string

					file?: string

					value?: any
				}
			}
	  }
	| undefined

type OwnerOptions = devToolsArguments

// general

type Signal = () => any
type SignalAccessor = () => any

type SignalOptions =
	| ({
			equals?: false | ((a, b) => boolean)
			label?: string
	  } & devToolsArguments)
	| undefined

type SignalSetter = (
	value?: any | ((prevValue?: any) => any),
) => unknown

type SignalObject<T> =
	| [Signal, SignalSetter, SignalSetter]
	| { read: Signal; write: SignalSetter; update: SignalSetter }

// props

type Props = {
	[key: PropertyKey]: any
}

type When = Signal | boolean | any

type Each =
	| Signal
	| (() => Each)
	| unknown[]
	| Map<unknown, unknown>
	| Set<unknown>

// components

type Children = any

type Component = ((props?: Props) => Children) | Function

type Componenteable =
	| string
	| Elements
	| object
	| FunctionConstructor
	| Component

// objects

type GenericObject<T> = {
	[K in keyof T]: T[K]
}

type Generic<T> = T

// tests

type Expect = {
	toBe: (expected: any) => Promise<any>
	toHaveShape: (expected: any) => Promise<any>
	not: {
		toBe: (expected: any) => Promise<any>
		toHaveShape: (expected: any) => Promise<any>
	}
}
