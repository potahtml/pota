/**
 * Generates a standalone version of pota. This is provided mostly for
 * the docs website to allow preview and run code.
 *
 * @url dist/pota.standalone.js -- includes solid-js
 */

import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const outputOptions = {
  format: 'es',
  sourcemap: true,
  sourcemapExcludeSources: true,
}

export default [
  {
    input: './pota.standalone.template.js',
    plugins: [
      json(),
      resolve({}),
      babel({
        babelHelpers: 'bundled',
        presets: [['pota/babel-preset']],
      }),
      terser(),
    ],
    output: [
      {
        ...outputOptions,
        file: '../dist/pota.standalone.js',
      },
    ],
  },
]
