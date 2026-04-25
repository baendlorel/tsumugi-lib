# rollup-plugin-hide-private

Remove selected `private` and `protected` members from generated TypeScript declaration files.

This plugin is designed for declaration build steps, especially when you bundle `.d.ts` output with `rollup-plugin-dts`.

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
type DeclarationNamePattern = string | RegExp;
type DeclarationNamePatternList = DeclarationNamePattern[];
type HideNameMatcher = boolean | DeclarationNamePatternList;

interface RollupHidePrivateOptions {
  privateNames?: HideNameMatcher;
  protectNames?: HideNameMatcher;
  allNames?: DeclarationNamePatternList;
}
```

- `privateNames` (default: `true`)
  - `true`: remove every `private` member.
  - `false`: keep every `private` member.
  - `Array<string | RegExp>`: remove only matching `private` member names.
- `protectNames` (default: `true`)
  - `true`: remove every `protected` member.
  - `false`: keep every `protected` member.
  - `Array<string | RegExp>`: remove only matching `protected` member names.
- `allNames` (default: `[]`)
  - Removes any matching class member name from the declaration file, even if it is not `private` or `protected`.
  - Accepts only arrays.
  - Every item must be either a string or a regular expression.

String matchers use exact matching. Regular expressions are tested against the member name.

## Notes

- The plugin removes matching class members directly from declaration source text, then emits a fresh sourcemap.
- It works for declaration chunks and declaration module inputs.
- For `#private` fields, both `#name` and `name` can match a configured string or regular expression.

## License

MIT