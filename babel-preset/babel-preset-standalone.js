import potaPreset from './babel-preset.js'

Babel.registerPreset('pota', (ctx, options = {}) => ({
	presets: [
		[
			Babel.availablePresets.typescript,
			{ isTSX: true, allExtensions: true },
		],
	],
	plugins: potaPreset(ctx, options).plugins,
}))
