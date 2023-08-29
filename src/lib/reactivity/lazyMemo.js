// lazy memo runs only after use, by fabiospampinato@solid-js/discord
import { signal, memo } from '#main'

export function lazyMemo(fn) {
	const [sleeping, setSleeping] = signal(true)
	const m = memo(() => {
		if (sleeping()) return
		return fn()
	})
	return () => {
		setSleeping(false)
		return m()
	}
}
