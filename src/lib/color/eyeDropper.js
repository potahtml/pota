import { noop } from '../std/noop.js'

export const eyeDropper = cb =>
	!window.EyeDropper
		? console.error('Your Browser Doesnt Support Picking Colors!')
		: new EyeDropper()
				.open()
				.then(result => {
					cb(result.sRGBHex)
				})
				.catch(noop)
