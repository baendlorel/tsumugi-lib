# rollup-plugin-hide-private

![npm version](https://img.shields.io/npm/v/rollup-plugin-hide-private.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Remove selected declaration members from generated TypeScript declaration files.

This plugin is designed for declaration build steps, especially when you bundle `.d.ts` output with `rollup-plugin-dts`.

Place `hidePrivate()` before `dts()` in the Rollup plugins array so declaration members are removed before `rollup-plugin-dts` emits the final bundle.

The plugin supports two modes:

- `normal` mode: the current behavior, transforming declaration output inside the Rollup pipeline.
- `write-files` mode: directly rewrites matched declaration files on disk during `writeBundle`.

**More Rollup Plugins** you might be interested in:

![More Plugins](https://github.com/baendlorel/tsumugi-lib/raw/refs/heads/main/assets/rollup-plugins.svg)

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Install

```bash
pnpm add -D rollup-plugin-hide-private rollup typescript
```

## Usage

### Normal mode

```ts
import dts from 'rollup-plugin-dts';
import hidePrivate from 'rollup-plugin-hide-private';

export default {
  input: 'dist/types/index.d.ts',
  output: [{ file: 'dist/index.d.ts', format: 'es', sourcemap: true }],
  plugins: [
    hidePrivate({
      privateNames: true,
      protectedNames: [/^internal/, 'debugOnly'],
      publicNames: [/^debug/],
      interfaces: ['__internal'],
      types: [/^__typeInternal/],
      allNames: ['__internal', /^debug/],
    }),
    dts(),
  ],
};
```

The plugin only processes declaration outputs such as `.d.ts`, `.d.mts` and `.d.cts`.

### Write-files mode

Use this mode when you already have declaration files on disk and want the plugin to rewrite only selected files matched by glob patterns.

```ts
import hidePrivate from 'rollup-plugin-hide-private';

export default {
  input: 'src/index.ts',
  output: [{ dir: 'dist', format: 'es' }],
  plugins: [
    hidePrivate({
      mode: 'write-files',
      cwd: process.cwd(),
      filePatterns: ['dist/types/**/*.d.ts', 'dist/**/*.d.mts'],
      privateNames: true,
      protectedNames: [/^internal/],
    }),
  ],
};
```

In `write-files` mode, `filePatterns` is required and must be an array of glob strings.

## Options

```ts
interface RollupHidePrivateOptions {
  // `normal` by default
  mode?: 'normal' | 'write-files';

  // Required when mode is `write-files`
  filePatterns?: string[];

  // `process.cwd()` by default
  cwd?: string;

  // `true` by default
  privateNames?: boolean | Pattern[];

  // `true` by default
  protectedNames?: boolean | Pattern[];

  // `false` by default
  publicNames?: boolean | Pattern[];

  // `[]` by default
  allNames?: Pattern[];

  // `false` by default
  interfaces?: false | Pattern[];

  // `false` by default
  types?: false | Pattern[];
}
```

`Pattern` means either a string or a regular expression.

`mode: 'normal'` keeps the existing Rollup transform/renderChunk behavior.

`mode: 'write-files'` skips in-memory declaration transforms and instead rewrites declaration files matched by `filePatterns` during `writeBundle`.

`allNames` is evaluated for private, protected, public, interface, and type-literal members.

`interfaces` and `types` provide extra pattern-based filtering for interface members and type-literal members. They accept either `false` or a pattern array.


## Effect

<span style="color: #ff7b00;font-weight:bold;">Before<span>

```ts
export class AAA {
  private a: number;
  asdf: string = 'asdf';
  _asdf: string = 'asdf';
  constructor(a: number) {
    this.a = a;
  }
}
```
With options:

```ts
hidePrivate({
  allNames: [/^_/],
})
```

<span style="color: #07AACC;font-weight:bold;">After<span>

```ts
declare class AAA {
    asdf: string;
    constructor(a: number);
}
```

## License

MIT