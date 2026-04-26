import type { Plugin } from 'rollup';
import type { RollupConstEnumOptions } from './types/global.js';
import { createTsContext } from './create-ts-context.js';
import { normalize } from './options.js';
import { inlineEnumAccess } from './inline-enum-access.js';

/**
 * ## Usage
 * This is a simple plugin with no ast parsers.
 * Uses regex to detect const enum declarations and replace them.
 *
 * ```ts
 * export default {
 *   ...,
 *   plugins:[
 *     constEnum(), // place it near the front
 *     ...,
 *   ]
 * }
 * ```
 *
 * __PKG_INFO__
 */
export default function constEnum(options?: Partial<RollupConstEnumOptions>) {
  const opts = normalize(options);

  const plugin: Plugin = {
    name: '__NAME__',
    transform(code, id) {
      if (!isSupportedFile(id)) {
        return null;
      }

      const context = createTsContext(id, code);
      if (!context) {
        return null;
      }

      return inlineEnumAccess(code, {
        checker: context.checker,
        filename: id,
        options: opts,
        sourceFile: context.sourceFile,
      });
    },
  };

  return plugin;
}

function isSupportedFile(id: string) {
  return /\.(cts|mts|ts|tsx)$/.test(id);
}
