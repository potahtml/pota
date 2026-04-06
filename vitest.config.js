import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import babel from 'vite-plugin-babel'

export default defineConfig({
	plugins: [
		babel({
			babelConfig: {
				presets: ['./src/babel-preset'],
			},
			filter: /\.[jt]sx?$/,
		}),
	],
	test: {
		include: ['tests/**/*.jsx'],
		exclude: ['tests/index.js'],
		coverage: { enabled: false },
		// bail: 1,
		// maxConcurrency: 1,
		browser: {
			provider: playwright(),
			enabled: true,
			instances: [{ browser: 'chromium' }],
			headless: false,
			screenshotFailures: false,
		},
	},
})
