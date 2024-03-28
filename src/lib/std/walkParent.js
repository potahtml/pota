export function walkParent(context, cb) {
	let r
	while (context) {
		r = cb(context)
		if (r) return r
		context = context.parent
	}
}
