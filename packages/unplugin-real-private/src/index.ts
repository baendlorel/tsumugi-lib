import { createRequire } from 'node:module';
import { createUnplugin, type UnpluginFactory, type UnpluginInstance } from 'unplugin';
import MagicString from 'magic-string';
import ts from 'typescript';
import { transformModule } from './core/transformer.js';
import { matchesFilter, resolveOptions } from './options.js';
import type { RealPrivateOptions } from './types.js';

export type { RealPrivateFilter, RealPrivateMode, RealPrivateOptions, ResolvedRealPrivateOptions } from './types.js';
export { resolveOptions } from './options.js';

const PLUGIN_NAME = 'unplugin-real-private';
const TS_EXTENSION = /\.(?:[cm]?ts|tsx)$/;

let cachedTypescript: typeof ts | undefined;

/**
 * `typescript` is a peer dependency, so it is resolved at transform time rather
 * than at import time: importing the plugin must not fail before the host build
 * actually hands it a module.
 */
export function loadTypescript(): typeof ts {
  if (cachedTypescript) {
    return cachedTypescript;
  }

  const require = createRequire(import.meta.url);
  let loaded: typeof ts | { default?: typeof ts };

  try {
    loaded = require('typescript');
  } catch {
    throw new Error(
      `[${PLUGIN_NAME}] Cannot resolve "typescript". Install it next to your bundler: \`pnpm add -D typescript\`.`,
    );
  }

  cachedTypescript = (loaded as { default?: typeof ts }).default ?? (loaded as typeof ts);
  return cachedTypescript;
}

export const unpluginFactory: UnpluginFactory<RealPrivateOptions | undefined> = (rawOptions) => {
  const options = resolveOptions(rawOptions ?? {});

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',

    transform(code, id) {
      if (!TS_EXTENSION.test(id)) {
        return null;
      }

      if (options.filter.include && !matchesFilter(id, options.filter.include)) {
        return null;
      }

      if (matchesFilter(id, options.filter.exclude)) {
        return null;
      }

      const typescript = loadTypescript();
      const sourceFile = typescript.createSourceFile(id, code, typescript.ScriptTarget.Latest, true, scriptKindOf(id));
      const magicString = new MagicString(code);
      const { diagnostics } = transformModule(sourceFile, options, magicString);

      const failure = diagnostics.find((diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error);
      if (failure) {
        this.error({ message: failure.message, id, loc: { file: id, line: failure.line, column: failure.column } });
        return null;
      }

      for (let i = 0; i < diagnostics.length; i++) {
        this.warn({
          message: diagnostics[i].message,
          id,
          loc: { file: id, line: diagnostics[i].line, column: diagnostics[i].column },
        });
      }

      if (!magicString.hasChanged()) {
        return null;
      }

      return { code: magicString.toString(), map: magicString.generateMap({ source: id, hires: true }) };
    },
  };
};

function scriptKindOf(id: string): ts.ScriptKind {
  return id.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

export const unplugin: UnpluginInstance<RealPrivateOptions | undefined> = createUnplugin(unpluginFactory);

export default unplugin;
