/**
 * Generates a standalone version of pota
 *
 * @url dist/pota.standalone.js -- includes solid-js
 * @url dist/pota.standalone.cjs -- includes solid-js
 * @url dist/pota.standalone.small.js -- doesnt include solid-js
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
const output = {
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
}

export default [
  // module with solid
  {
    ...output,
    output: [
      {
        ...outputOptions,
        file: '../dist/pota.standalone.js',
      },
    ],
  },
  // module without solid
  {
    ...output,
    output: [
      {
        ...outputOptions,
        file: '../dist/pota.standalone.small.js',
      },
    ],
    external: ['solid-js/dist/solid.js'],
  },
  // cjs with solid
  {
    ...output,
    output: [
      {
        ...outputOptions,
        format: 'cjs',
        file: '../dist/pota.standalone.cjs',
      },
    ],
  },
]
