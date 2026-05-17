## rollup-plugin-const-enum

[![npm version](https://img.shields.io/npm/v/rollup-plugin-const-enum.svg)](https://www.npmjs.com/package/rollup-plugin-const-enum) [![npm downloads](http://img.shields.io/npm/dm/rollup-plugin-const-enum.svg)](https://npmcharts.com/compare/rollup-plugin-const-enum,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/rollup-plugin-const-enum?utm_source=github.com&utm_medium=referral&utm_content=Borewit/rollup-plugin-const-enum&utm_campaign=Badge_Grade)

A Rollup plugin that uses the TypeScript compiler API to inline enum member accesses such as `Colors.Red` -> `0` or `Status.Active` -> `"active"`.

> 2.0.0 is a major refactor that replaces the original regex-based scanning approach with a more robust TypeScript compiler API-based implementation. This allows for more accurate and reliable enum member inlining, especially in complex codebases with various import patterns and TypeScript features.

**More Rollup Plugins** you might be interested in:

![More Plugins](https://github.com/baendlorel/tsumugi-lib/raw/refs/heads/main/assets/rollup-plugins.svg)

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

[ChangeLog](CHANGELOG.md)

## Install

Use pnpm to install as a devDependency:

```bash
pnpm add -D rollup-plugin-const-enum rollup typescript
```

## Quick usage

Place the plugin before your TypeScript transpilation step so it can still see the original enum syntax:

```js
import { constEnum } from 'rollup-plugin-const-enum';

export default {
  // ...
  plugins: [
    constEnum(), // place it near the front
    ...
  ],
};
```

## Behavior

- Only enum member accesses that are available in the current file are considered.
- Cross-file enums must be explicitly imported in the current module before they can be inlined.
- Same-file enum declarations can always be inlined.
- The transform returns a sourcemap.

## Options

The plugin accepts an optional options object. All options are optional and have sensible defaults.

- `inlineNonConstEnums: boolean` — Inline regular `enum` members in addition to `const enum`. Default: `false`.
- `inlineNames?: Array<string | RegExp>` — Restrict inlining to enums whose declaration names match one of these rules. Default: `undefined`.

Validation:

- `inlineNonConstEnums` must be a boolean when provided.
- `inlineNames` must be an array of `string | RegExp` when provided.

### Example

```js
import constEnum from 'rollup-plugin-const-enum';

export default {
  plugins: [
    constEnum({
      inlineNonConstEnums: true,
      inlineNames: ['Color', /^Status$/],
    }),
  ],
};
```

## Important notes

- It relies on TypeScript's symbol resolution, so project `tsconfig.json` settings can affect module resolution.
- If TypeScript cannot evaluate an enum member access as a constant, the original code is kept unchanged.
- The plugin only transforms TypeScript source files.

## License

MIT
