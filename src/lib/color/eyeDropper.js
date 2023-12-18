import { noop } from '../std/noop.js'

export function eyeDropper(cb) {
	if (!window.EyeDropper) {
		throw new Error('Your Browser Doesnt Support Picking Colors!')
	} else {
		new EyeDropper()
			.open()
			.then(result => {
				cb(result.sRGBHex)
			})
			.catch(noop)
	}
}
