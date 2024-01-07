/**
 * Generates a standalone version of pota. This is provided mostly for
 * the docs website to allow preview and run code.
 *
 * @url dist/pota.standalone.js -- includes solid-js
 */

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default [
  {
    input: './pota.standalone.template.js',
    plugins: [
      resolve({}),
      babel({
        babelHelpers: 'bundled',
        presets: [['pota/babel-preset']],
      }),
      terser(),
    ],
    output: [
      {
        format: 'es',
        sourcemap: 'inline',
        sourcemapExcludeSources: false,
        file: '../dist/pota.standalone.js',
      },
    ],
  },
]
