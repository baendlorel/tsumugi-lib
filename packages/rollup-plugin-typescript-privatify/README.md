# rollup-plugin-typescript-privatify

Custom transformer preset for `@rollup/plugin-typescript`.

It rewrites TypeScript `private` class members into runtime-private implementations in 2 modes.

> Note: this package is not a direct Rollup plugin. It is a preset for `@rollup/plugin-typescript`'s `transformers` option.
> Note: `pnpm add typescript` is required.

## Install

```bash
pnpm add -D rollup-plugin-typescript-privatify @rollup/plugin-typescript typescript
```

## Usage

```ts
import typescript from '@rollup/plugin-typescript';
import typescriptPrivatify from 'rollup-plugin-typescript-privatify';

export default {
  plugins: [
    typescript({
      transformers: typescriptPrivatify({
        mode: 'hash', // or "weakmap"
      }),
    }),
  ],
};
```

> This package is not a direct Rollup plugin. If you put it in `plugins: []`, it will throw a usage error and tell you to move it into `typescript({ transformers: ... })`.

## Options

- `mode: "hash" | "weakmap"` (default: `"hash"`)
  - `hash`: convert `private foo` to `#foo`.
  - `weakmap`: generate a companion `ClassName__private` and a `WeakMap` to store private state/methods.
- `hidePrivateDeclarations: boolean` (default: `false`)
  - when `true`, registers an `afterDeclarations` transformer to remove `private` members from declaration AST.
  - if your declarations are produced by another toolchain stage (for example `rollup-plugin-dts`), this option will not affect that stage.

## Use With rollup-plugin-dts

When you bundle declarations with `rollup-plugin-dts`, use the named plugin export:

```ts
import { dts } from 'rollup-plugin-dts';
import { hidePrivateDeclarationsForDts } from 'rollup-plugin-typescript-privatify';

export default {
  input: 'dist/types/index.d.ts',
  output: [{ file: 'dist/index.d.ts', format: 'es' }],
  plugins: [dts(), hidePrivateDeclarationsForDts()],
};
```

`hidePrivateDeclarationsForDts()` can run before or after `dts()`, but placing it after is usually clearer because it operates on bundled declaration output.

## weakmap mode shape

For `class A`, the transformer emits:

- `class A__private { ... }`
- `const __A_private = new WeakMap();`
- `__A_private.set(this, new A__private())` in constructor
- private method calls become `__A_private.get(this).method.call(this, ...)`

## Notes

- This package is a transformer preset, not a direct Rollup plugin.
- Anonymous classes in `weakmap` mode fall back to `hash` mode.
