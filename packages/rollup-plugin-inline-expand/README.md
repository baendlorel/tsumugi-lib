# rollup-plugin-func-expand

Expand selected function calls at usage sites with macro-like substitution.

## Installation

```bash
npm install --save-dev rollup-plugin-func-expand
pnpm add -D rollup-plugin-func-expand
```

## Usage

```ts
import funcExpand from 'rollup-plugin-func-expand';

export default {
  plugins: [
    funcExpand({
      names: ['add', 'calc'],
      include: '**/*.ts',
      exclude: '**/*.spec.ts',
    }),
  ],
};
```

## Options

```ts
interface RollupInlineFunctionOptions {
  names: string[];
  include?: FilterPattern;
  exclude?: FilterPattern;
}
```

- `names`: function names to expand.
- `include`: include filter pattern (same behavior as Rollup plugin filters).
- `exclude`: exclude filter pattern.

## Notes

- Expression-body functions are expanded directly as expressions.
- Block-body functions are expanded as raw fragments (macro style) and are most suitable for statement-position calls.
- No wrapper function expressions / IIFEs are introduced during expansion.
- Supports inlining functions imported from relative modules (named/default import) when they can be statically resolved.
- Imported modules are parsed as JavaScript syntax; if your `.ts` files contain type annotations, run this plugin after TypeScript transpilation.
- Function declarations / single-declarator `const` function bindings are removed when every reference is expanded call usage.
- Argument substitution is macro-like: a parameter used multiple times will duplicate the argument expression.
