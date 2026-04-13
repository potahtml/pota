/// <reference path="../public/pota.d.ts"/>

export type Context = {
	base: string | undefined
	href: () => string
	parent: Context | undefined
	params?: SignalAccessor<() => Record<string, unknown>>
	addChild: (child: Context) => void
	shouldShowDefault: SignalAccessor<boolean | 0>
	resolve: (href: string) => string
	show: SignalAccessor<boolean | undefined>
	scroll?: string[] | string
}
