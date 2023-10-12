import { markComponent } from '#comp'

export function lazyComponent(path) {
	return import(path).then(r => r && markComponent(r.default))
}
