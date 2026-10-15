import { createRequire } from 'node:module';
import { defineConfig, type Plugin } from 'vitest/config';
import { getAliases } from './scripts/aliases';

// `esbuild` is a transitive dependency of Vite, so it is not resolvable as a bare import from
// this file. Anchor the lookup at Vite's own package, which is a declared dependency.
const esbuildTransform = async (code: string, loader: 'ts' | 'tsx') => {
  const esbuild = createRequire(require.resolve('vite/package.json'))('esbuild') as typeof import('esbuild');
  return esbuild.transform(code, { loader, target: 'es2022', sourcemap: true });
};

/**
 * Vite 8 transforms TypeScript with oxc, which leaves class decorators untouched — Node then
 * fails to parse the `@` syntax (`SyntaxError: Invalid or unexpected token`). This plugin
 * downlevels decorators with esbuild first; its output follows the TC39 semantics that oxc
 * otherwise preserves (`ctx.kind` / `ctx.name` / `ctx.addInitializer`).
 *
 * Only files that actually contain decorator syntax are run through esbuild, so the cost is
 * paid by the handful of test files that need it.
 */
function decoratorDownlevel(): Plugin {
  // `@Name` / `@ns.name` at the start of a line, or an inline `@(...)`/`@[expr]` decorator.
  const decoratorLike = /^\s*@[A-Za-z_$([]/m;

  return {
    name: 'decorator-downlevel',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes('node_modules')) return null;
      if (!/\.[cm]?[jt]sx?$/.test(id)) return null;
      if (!decoratorLike.test(code)) return null;

      const result = await esbuildTransform(code, id.endsWith('x') ? 'tsx' : 'ts');
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [decoratorDownlevel()],
    test: {
      // setupFiles: ['./scripts/vitest.setup.ts'],
      include: ['**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)'],
      silent: false,
    },
    resolve: {
      alias: getAliases(),
    },
  };
});
