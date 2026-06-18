import potaPreset from './babel-preset.js'

Babel.registerPreset('pota', (ctx, options = {}) => ({
	presets: [
		[
			Babel.availablePresets.typescript,
			// Babel 8 removed `isTSX`/`allExtensions`. `ignoreExtensions`
			// strips types from every input regardless of extension (the
			// old `allExtensions: true`); JSX parsing is already forced by
			// the pota preset, which `inherits` @babel/plugin-syntax-jsx.
			{ ignoreExtensions: true },
		],
	],
	plugins: potaPreset(ctx, options).plugins,
}))
