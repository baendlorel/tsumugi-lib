# rollup-plugin-hide-private

Remove selected `private` and `protected` members from generated TypeScript declaration files.

This plugin is designed for declaration build steps, especially when you bundle `.d.ts` output with `rollup-plugin-dts`.

## More Plugins

<img src="https://github.com/baendlorel/tsumugi-lib/releases/download/rollup-plugins-svg-v0.1.0/rollup-plugins.svg"/>


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
    dts(),
    hidePrivate({
      privateNames: true,
      protectNames: [/^internal/, 'debugOnly'],
      allNames: ['__internal', /^debug/],
    }),
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
  allNames?: boolean | Pattern[];
}
```

`Pattern` means either a string or a regular expression.


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