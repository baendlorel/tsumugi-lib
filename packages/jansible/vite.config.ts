import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      fileName: 'jansible',
      formats: ['es'],
    },
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        banner: `#!/usr/bin/env node \n  'built at ${new Date().toLocaleString()}'`,
      },
      external: [/node:/],
    },
    target: 'node14',
    minify: false,
    sourcemap: false,
  },
  plugins: [
    (replace as any)({
      preventAssignment: true,
      values: {
        __IS_DEV__: process.env.NODE_ENV === 'production' ? 'false' : 'true',
        __NAME__: pkg.name,
        __VERSION__: pkg.version,
      },
    }),
  ],
  resolve: {},
});
