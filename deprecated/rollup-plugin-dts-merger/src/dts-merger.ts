import { relative } from 'node:path';
import { readFileSync, existsSync, statSync, appendFileSync, writeFileSync } from 'node:fs';
import { Plugin } from 'rollup';

import { replace, stringify } from './replace.js';
import { RollupDtsMergerOptions } from './global.js';
import { getFiles } from './get-files.js';

export function normalize(options?: RollupDtsMergerOptions): __STRICT_OPTS__ {
  const {
    include = ['src/**'],
    exclude = ['test/**', 'tests/**', 'dist/**', 'node_modules/**'],
    mergeInto = 'dist/index.d.ts',
    replace: rawReplace = {},
  } = Object(options) as RollupDtsMergerOptions;

  if (typeof mergeInto !== 'string') {
    throw new TypeError('mergeInto must be a string');
  }
  if (rawReplace === null || typeof rawReplace !== 'object') {
    throw new TypeError('replace must be an object');
  }

  const replaceList: string[] = [];
  Object.entries(rawReplace).forEach(([key, value]) => {
    if (typeof value === 'function') {
      replaceList.push(key, String(value(key)));
    } else {
      replaceList.push(key, String(value));
    }
    replaceList.push(key, stringify(key, value));
  });

  return { list: getFiles(include, exclude), mergeInto, replaceList };
}

/**
 * ## Intro
 * Find all `.d.ts` files in directories(default: 'src') as your provided. Then append their content to the target declaration file, default (default: 'dist/index.d.ts')
 *
 * We have a built in simple replacer which looks like '@rollup/plugin-replace', shares some same options.
 *
 * @params options RollupDtsMergerOptions
 * @returns Plugin
 *
 * ## Usage
 * Put it in plugins array in rollup.config.js
 * @example
 * ```typescript
 * {
 *   input: 'src/index.ts',
 *   output: [{ file: 'dist/index.d.ts', format: 'es' }],
 *   plugins: [dts({ tsconfig }), dtsMerger()],
 * }
 * ```
 * You can use options(RollupDtsMergerOptions) to customize the behavior
 *
 * __PKG_INFO__
 */
export function dtsMerger(options?: RollupDtsMergerOptions): Plugin {
  const cwd = process.cwd();
  const opts = normalize(options);

  const plugin: Plugin = {
    name: '__NAME__',
    writeBundle() {
      const { list, mergeInto, replaceList } = opts;

      if (!existsSync(mergeInto)) {
        const rel = relative(cwd, mergeInto);
        // & only warns but not quit
        throw new Error(`__NAME__: '${rel}' does not exist, please check the order of plugins!`);
      }

      // first, replace the content of `mergeInto` target
      if (existsSync(mergeInto) && statSync(mergeInto).isFile()) {
        let content = readFileSync(mergeInto, 'utf8');
        content = replace(replaceList, content);
        writeFileSync(mergeInto, content, 'utf8');
      }

      // replace and append
      for (let i = 0; i < list.length; i++) {
        let content = readFileSync(list[i], 'utf8');
        content = replace(replaceList, content);

        const relativePath = relative(cwd, list[i]);
        const s = `\n// \u0023 from: ${relativePath}\n${content}`;
        appendFileSync(mergeInto, s, 'utf8');
      }
    },
  };

  Reflect.defineProperty(plugin, '__KSKB_TMG_OPTS__', { value: opts });

  return plugin as Plugin;
}
