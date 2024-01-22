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

const pluginsOby = [
  resolve({}),
  babel({
    babelHelpers: 'bundled',
    presets: [['pota/babel-preset', { lib: 'oby' }]],
  }),
  terser(),
]

const pluginsNoMinOby = [
  resolve({}),
  babel({
    babelHelpers: 'bundled',
    presets: [['pota/babel-preset', { lib: 'oby' }]],
  }),
]

export default [
  // full solid
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

  // full solid no min
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

  // full oby
  {
    input: './standalone.js',
    plugins: pluginsOby,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.oby.js',
      },
    ],
  },

  // full oby no min
  {
    input: './standalone.js',
    plugins: pluginsNoMinOby,
    output: [
      {
        ...outputOptions,
        file: '../dist/standalone.oby.no-min.js',
      },
    ],
  },
]
