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
  // regular
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
  // full
  {
    input: './standalone.full.js',
    plugins,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.full.js',
      },
    ],
  },
  // full no min
  {
    input: './standalone.full.js',
    plugins: pluginsNoMin,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.full.no-min.js',
      },
    ],
  },
  // no router
  {
    input: './standalone.router-no.js',
    plugins,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.router-no.js',
      },
    ],
  },
  // without solid
  {
    input: './standalone.js',
    plugins,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.solid-no.js',
      },
    ],
    external: ['solid-js/dist/solid.js'],
  },
  // no router without solid
  {
    input: './standalone.router-no.js',
    plugins,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.router-no.solid-no.js',
      },
    ],
    external: ['solid-js/dist/solid.js'],
  },
]
