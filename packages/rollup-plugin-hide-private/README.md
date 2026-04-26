# rollup-plugin-hide-private

![npm version](https://img.shields.io/npm/v/rollup-plugin-hide-private.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Remove selected `private` and `protected` members from generated TypeScript declaration files.

This plugin is designed for declaration build steps, especially when you bundle `.d.ts` output with `rollup-plugin-dts`.

Place `hidePrivate()` before `dts()` in the Rollup plugins array so declaration members are removed before `rollup-plugin-dts` emits the final bundle.

**More Rollup Plugins** you might be interested in:

![More Plugins](https://github.com/baendlorel/tsumugi-lib/raw/refs/heads/main/assets/rollup-plugins.svg)

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Install

```bash
pnpm add -D rollup-plugin-hide-private rollup typescript
```

## Usage

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
      allNames: ['__internal', /^debug/],
      interfaces: true,
    }),
    dts(),
  ],
};
```

The plugin only processes declaration outputs such as `.d.ts`, `.d.mts` and `.d.cts`.

## Options

```ts
interface RollupHidePrivateOptions {
  // `true` by default
  privateNames?: boolean | Pattern[];

  // `true` by default
  protectedNames?: boolean | Pattern[];

  // `[]` by default
  allNames?: Pattern[];

  // `false` by default
  interfaces?: boolean;
}
```

`Pattern` means either a string or a regular expression.

`interfaces` only applies to `allNames`. When enabled, matching members inside `interface` declarations are removed as well.


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