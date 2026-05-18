// rollup.mjs
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/parser.skill.ts',
  output: {
    file: 'liuyao-skill/parser.skill.js',
    format: 'esm',
    sourcemap: false,
  },

  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    copy({
      targets: [{ src: 'src/SKILL.md', dest: 'liuyao-skill/' }],
      verbose: true,
    }),
    replace({
      preventAssignment: true,
      values: {
        UPDATED_AT: JSON.stringify(new Date().toISOString()),
      },
    }),
    terser({
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: [],
      },
      output: {
        comments: false,
      },
    }),
  ],

  external: [],
};
