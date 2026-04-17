import { FilterPattern } from '@rollup/pluginutils';

export interface RollupDtsMergerOptions {
  /**
   * A valid picomatch glob pattern, or array of patterns.
   * @default `['src/**']`
   */
  include?: FilterPattern;

  /**
   * A valid picomatch glob pattern, or array of patterns.
   * - Definitely exclude `node_modules`(even if you pass `[]` to it) to avoid unnecessary processing
   * @default `['test/**', 'tests/**', 'dist/**', 'node_modules/**']`
   */
  exclude?: FilterPattern;

  /**
   * The file to merge into, relative to `process.cwd()`
   * - if it is an array, will use `path.join(<cwd>,...mergeInto)`
   * @default 'dist/index.d.ts'
   */
  mergeInto?: string;

  /**
   * Simply use `String.prototype.replaceAll`, instead of using the replacer.
   * - This is useful to make non-global `.d.ts` files can export types after building;
   *
   * by setting `rawReplace: { '\/＊__FLAG__＊\/': 'export' }`, then in your `.d.ts` files, you can write:
   * ```ts
   * // some.d.ts file content
   * /＊__FLAG__＊/ declare const XXX: boolean;
   * ```
   * built:
   * ```ts
   * // dts-merged
   * export declare const XXX: boolean;
   * ```
   */
  replace?: Record<string, any>;
}
