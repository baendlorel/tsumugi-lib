// rollup.mjs
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/parser.skill.ts',
  output: {
    file: 'dist/parser.skill.js',
    format: 'esm',
    sourcemap: false,
  },

  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
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
