type RouteContext = {
	base: string | undefined
	href: () => string
	parent: RouteContext | undefined
	params?: SignalAccessor<() => Record<string, unknown>>
	addChild: (child: RouteContext) => void
	shouldShowDefault: SignalAccessor<boolean | 0>
	resolve: (href: string) => string
	show: SignalAccessor<boolean | undefined>
	scroll?: string[] | string
}
