# unplugin-real-private

[![npm version](https://img.shields.io/npm/v/unplugin-real-private.svg)](https://www.npmjs.com/package/unplugin-real-private) [![npm downloads](http://img.shields.io/npm/dm/unplugin-real-private.svg)](https://npmcharts.com/compare/unplugin-real-private)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Turn TypeScript `private` class members into real ECMAScript private members.

`private` is a compile-time promise. It stops other TypeScript code from touching the member, but the member is still an ordinary property at runtime: it shows up in `Object.keys()`, it can be read and overwritten from plain JavaScript, and it survives into the bundle under its original name. This plugin rewrites those members into `#private` fields (ES2022), which the engine actually enforces.

It is built with [unplugin](https://github.com/unjs/unplugin), so the same plugin works in Vite, Rollup, Rolldown, Webpack, Rspack, Rsbuild, esbuild, Farm, and Bun.

**More unplugin / Rollup Plugins** you might be interested in:

![More Plugins](https://github.com/baendlorel/tsumugi-lib/raw/refs/heads/main/assets/rollup-plugins.svg)

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Before / after

```ts
class Counter {
  private count = 0;
  private static instances = 0;
  private label: string;

  constructor(private step: number, label = 'counter') {
    this.label = label;
    Counter.instances += 1;
  }

  private bump(): number {
    this.count += this.step;
    return this.count;
  }

  static get created(): number {
    return Counter.instances;
  }

  run(): string {
    return `${this.label}: ${this.bump()}`;
  }
}
```

```js
class Counter {
  #count = 0;
  static #instances = 0;
  #label;
  #step;

  constructor(step, label = 'counter') {
    this.#step = step;
    this.#label = label;
    Counter.#instances += 1;
  }

  #bump() {
    this.#count += this.#step;
    return this.#count;
  }

  static get created() {
    return Counter.#instances;
  }

  run() {
    return `${this.#label}: ${this.#bump()}`;
  }
}
```

```js
const counter = new Counter(3);
counter.count; // undefined
'count' in counter; // false
Object.getOwnPropertyNames(counter); // []
```

## Install

```bash
pnpm add -D unplugin-real-private typescript
```

`typescript` is a peer dependency (`>=4.5.0`) — the plugin parses with the copy of TypeScript your project already has, and resolves it lazily at transform time, so a project that never imports the plugin pays nothing for it.

## Usage

One import, then pick the entry for your bundler (`realPrivate.vite()`, `realPrivate.rollup()`, `realPrivate.webpack()`, ...).

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import realPrivate from 'unplugin-real-private';

export default defineConfig({
  plugins: [realPrivate.vite()],
});
```

### Rollup

```ts
// rollup.config.ts
import realPrivate from 'unplugin-real-private';

export default {
  plugins: [realPrivate.rollup()],
};
```

### Rolldown

```ts
// rolldown.config.ts
import realPrivate from 'unplugin-real-private';

export default {
  plugins: [realPrivate.rolldown()],
};
```

### esbuild

```ts
import { build } from 'esbuild';
import realPrivate from 'unplugin-real-private';

await build({
  plugins: [realPrivate.esbuild()],
});
```

### Webpack

```ts
// webpack.config.ts
import realPrivate from 'unplugin-real-private';

export default {
  plugins: [realPrivate.webpack()],
};
```

### Rspack

```ts
// rspack.config.ts
import realPrivate from 'unplugin-real-private';

export default {
  plugins: [realPrivate.rspack()],
};
```

### Rsbuild

```ts
// rsbuild.config.ts
import realPrivate from 'unplugin-real-private';

export default defineConfig({
  plugins: [realPrivate.rsbuild()],
});
```

### Farm

```ts
// farm.config.ts
import realPrivate from 'unplugin-real-private';

export default {
  plugins: [realPrivate.farm()],
};
```

The raw factory is exported as well, if you need to compose the plugin yourself:

```ts
import { unpluginFactory } from 'unplugin-real-private';
import { createUnplugin } from 'unplugin';

const plugin = createUnplugin(unpluginFactory);
```

## Options

```ts
interface RealPrivateOptions {
  /**
   * How `private` members are converted. Defaults to `'hash'`.
   * Only `'hash'` (ECMAScript `#private` fields) is supported today.
   */
  mode?: 'hash';

  /**
   * Modules to transform, matched against the module id (the absolute path).
   * Defaults to every `.ts` / `.tsx` / `.mts` / `.cts` module.
   */
  include?: string | RegExp | Array<string | RegExp>;

  /**
   * Modules to skip. Takes priority over `include`.
   */
  exclude?: string | RegExp | Array<string | RegExp>;

  /**
   * Warn instead of failing the build when a converted member would collide
   * with an existing `#` private member. Defaults to `false`.
   */
  silent?: boolean;
}
```

```ts
realPrivate.vite({
  include: ['src/entities'],
  exclude: [/node_modules/, /\.spec\.ts$/],
});
```

A string pattern containing `*` is treated as a glob (`src/**/*.ts`); a plain string is matched as a path segment (`src/entities` matches `/project/src/entities/user.ts`).

## What gets converted

| Input                                   | Output                                     |
| --------------------------------------- | ------------------------------------------ |
| `private x = 1`                         | `#x = 1`                                    |
| `private static x = 1`                  | `static #x = 1`                             |
| `private m(a: number) {}`               | `#m(a: number) {}`                          |
| `private get x() {}` / `private set x()` | `private` accessor becomes `#x`             |
| `private declare x: number`             | `declare #x: number`                        |
| `this.x` (inside the class)             | `this.#x`                                   |
| `ClassName.x` (for a static private `x`) | `ClassName.#x`                              |
| `constructor(private x: T) {}`          | `#x: T;` field + `this.#x = x` assignment   |

The declaration's own modifiers are preserved apart from the visibility keyword: `private static readonly x` becomes `static readonly #x`, and a `declare` field stays `declare`. `protected` and `public` members are never touched.

### Parameter properties

`constructor(private x: T) {}` means two things at once: the parameter `x`, and a `this.x = x` assignment. Since `#x` is not a valid parameter name, the plugin declares the field, keeps the parameter as a plain identifier, and writes the assignment explicitly:

```ts
class A {
  constructor(private x: number, private y = 1) {}
}
```

```js
class A {
  #x;
  #y;
  constructor(x, y = 1) {
    this.#x = x;
    this.#y = y;
  }
}
```

The field declaration is emitted where the constructor is, and the assignment right after `super(...)` in a derived class — the same points TypeScript would emit the parameter property's initializer. This matters if a subclass overwrites the same-named private member.

Only `private` parameter properties are converted. A `public` / `protected` / plain `readonly` parameter property remains reachable from outside (or from subclasses), so turning it into `#` would change what the class exposes; it keeps its original name and stays visible.

## Collisions

Only one declaration is allowed per `#` private name in a class, and a converted member would also silently override whatever the existing one holds. So when a `private x` would land on an existing `#x`, the build stops with an error:

```ts
class A {
  private x: number = 1;
  #x: string = 'a';
}
```

```
[plugin unplugin-real-private] /src/entry.ts:2:3
Cannot convert "private x" to "#x": the class already declares a "#x" member.
A class can only declare one "#x" private name, and the converted member would also override what "#x" holds today.
Rename one of them, or exclude this module. (class A)
```

The class is left untouched, and the error carries the file, line, and column of the offending member. The check covers `static #x`, `get`/`set #x`, and `#x` introduced by earlier plugins.

Renaming automatically is not an option here: `#x` is not in scope for the `this.x` references the class relies on today, so the converted member would be a different, silently-overriding field rather than a rename.

Set `silent: true` to downgrade this to a warning (the class is still left untouched).

## Scope and limitations

- Only `.ts`, `.tsx`, `.mts`, and `.cts` modules are processed — a plain `.js` file has no `private` keyword to convert.
- String (`private 'a b'`), numeric, and computed (`private [key]`) member names are left alone.
- Instance and static private members live in the same `#` namespace in JavaScript, so `private x` and `private static x` in one class are a collision.
- Class expressions are converted too, but only `this.x` / `ClassName.x` references are rewritten. If a class instance escapes and another module reads a private member off it, that read is untouched — `private` never allowed it either, so the compiler would already have objected.
- `private` on a constructor is a syntax-level annotation with no runtime member; it is left as is.

## License

MIT
