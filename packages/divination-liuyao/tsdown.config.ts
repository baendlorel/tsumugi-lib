import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import replace from '@rollup/plugin-replace';
import { defineConfig } from 'tsdown';
import { replaceOpts } from '../../scripts/replace-options';
import funcMacro from 'rollup-plugin-func-macro';

const replacer = replaceOpts(import.meta.dirname);
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    clean: false,
    sourcemap: true,
    minify: true,
    target: 'node24',
    treeshake: true,
    outDir: 'dist',
    plugins: [replace(replacer), funcMacro()],
  },
  {
    entry: ['src/parser.skill.ts'],
    format: 'esm',
    dts: false,
    clean: false,
    sourcemap: false,
    minify: true,
    target: 'node24',
    treeshake: true,
    bundle: true,
    outDir: 'liuyao-skill',
    copy: ['src/SKILL.md', 'src/books'],
    plugins: [replace(replacer), funcMacro()],
    hooks: {
      'build:done': () => {
        const p = join(import.meta.dirname, 'liuyao-skill', 'SKILL.md');
        const content = readFileSync(p, 'utf-8');
        writeFileSync(p, content.replaceAll('__VERSION__', replacer.values?.__VERSION__ as string));
      },
    },
  },
]);
