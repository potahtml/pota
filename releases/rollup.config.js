/** Generates a standalone version of pota */

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const outputOptions = {
  format: 'es',
  sourcemap: true,
  sourcemapExcludeSources: true,
}

const plugins = [
  resolve({}),
  babel({
    babelHelpers: 'bundled',
    presets: [['pota/babel-preset']],
  }),
  terser(),
]

const pluginsNoMin = [
  resolve({}),
  babel({
    babelHelpers: 'bundled',
    presets: [['pota/babel-preset']],
  }),
]

export default [
  {
    input: './standalone.js',
    plugins,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.js',
      },
    ],
  },

  {
    input: './standalone.js',
    plugins: pluginsNoMin,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.no-min.js',
      },
    ],
  },
]
