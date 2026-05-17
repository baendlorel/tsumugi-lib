// rollup.mjs
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/parser.skill.ts',
  output: {
    file: 'dist/parser.skill.js',
    format: 'esm',
    sourcemap: false,
  },

  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
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
