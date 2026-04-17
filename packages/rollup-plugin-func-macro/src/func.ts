import { basename } from 'node:path';
import { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import type { FuncMacroOptions } from './types/global.js';
import type { NameGetter } from './types/private.js';
import { normalize } from './core/normalize.js';
import { replaceIdentifiersBatch } from './core/replace.js';
import { findFunctionNameAtPosition } from './core/find-name.js';

/**
 * ## Usage
 * use `funcMacro()` in your Rollup configuration to enable the plugin.
 *
 * detailed infomation can be found in the type definition of `options`.
 *
 * __PKG_INFO__
 */
export function funcMacro(options?: Partial<FuncMacroOptions>): Plugin {
  const opts = normalize(options);
  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: '__KEBAB_NAME__',
    transform(code: string, id: string) {
      if (!filter(id)) {
        return null;
      }

      const filename = basename(id);
      const targets: {
        identifier: string;
        nameGetter: NameGetter;
      }[] = [];

      if (opts.identifier !== null) {
        if (code.includes(opts.identifier)) {
          targets.push({
            identifier: opts.identifier,
            nameGetter: findFunctionNameAtPosition,
          });
        }
      }

      if (opts.fileIdentifier !== null) {
        if (code.includes(opts.fileIdentifier)) {
          targets.push({
            identifier: opts.fileIdentifier,
            nameGetter: () => filename,
          });
        }
      }

      if (targets.length === 0) {
        return null;
      }

      const transformed = replaceIdentifiersBatch({
        code,
        targets,
        fallback: opts.fallback,
        stringReplace: opts.stringReplace,
      });

      if (transformed === null || transformed === code) {
        return null;
      }

      return { code: transformed, map: null };
    },
  };
}
