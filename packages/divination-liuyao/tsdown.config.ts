import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/parser.skill.ts'],
  format: 'esm',
  dts: false,
  clean: false,
  sourcemap: false,
  minify: true,
  target: 'node24',
  treeshake: true,
  outDir: 'liuyao-skill',
  copy: ['src/SKILL.md', 'src/books'],
});
