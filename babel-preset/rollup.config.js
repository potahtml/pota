/** Compiles ./plugin.js */

import terser from '@rollup/plugin-terser'

export default [
  {
    input: './plugin.js',
    plugins: [terser()],
    output: [
      {
        file: './plugin.cjs',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    external: [
      '@babel/core',
      '@babel/helper-module-imports',
      '@babel/helper-plugin-utils',
      '@babel/plugin-syntax-jsx',
      'validate-html-nesting',
    ],
  },
]
