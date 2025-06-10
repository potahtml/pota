type RouteContextValue = {
	base: string | undefined
	href: () => string
	parent: RouteContextValue | undefined
	params?: SignalAccessor<() => Record<string, unknown>>
	addChild: (child: RouteContextValue) => void
	shouldShowDefault: SignalAccessor<boolean | 0>
	resolve: (href: string) => string
	show: SignalAccessor<boolean | undefined>
	scroll?: string[] | string
}
