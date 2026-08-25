import { join } from 'node:path';
import { defineConfig } from 'tsdown';
import replace from '@rollup/plugin-replace';
import funcMacro from 'rollup-plugin-func-macro';
import { replaceOpts } from '../../scripts/replace-options.js';

const isDev = process.env.NODE_ENV === 'development';
const lib = process.env.LIB_DIR!;

export default defineConfig({
  cwd: lib,
  entry: [join(lib, 'src', 'index.ts')],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: false,
  minify: !isDev,
  target: 'node16',
  treeshake: !isDev,
  plugins: [replace(replaceOpts(lib)), funcMacro()],
});
