/**
 * How TypeScript `private` members are turned into runtime private members.
 *
 * - `hash`: rewrite them into ECMAScript private fields (`#x`, ES2022).
 */
export type RealPrivateMode = 'hash';

export type FilterPattern = string | RegExp | Array<string | RegExp>;

export interface RealPrivateFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface RealPrivateOptions {
  /**
   * The conversion mode. Defaults to `'hash'`.
   */
  mode?: RealPrivateMode;

  /**
   * Modules to transform. Matched against the module id (the absolute file path).
   *
   * When omitted, every `ts` / `tsx` / `mts` / `cts` module is transformed.
   * A bare string without a glob wildcard is treated as a path segment
   * (e.g. `'src/utils'` matches `/project/src/utils/foo.ts`).
   */
  include?: FilterPattern;

  /**
   * Modules to skip. Has a higher priority than `include`.
   */
  exclude?: FilterPattern;

  /**
   * Emit a warning instead of failing the build when a converted member would
   * collide with an existing `#` private member of the same class.
   *
   * Defaults to `false`: a collision is a hard error, because renaming would
   * silently break the `this.x` references the class relies on today.
   */
  silent?: boolean;
}

export interface ResolvedRealPrivateOptions {
  mode: RealPrivateMode;
  filter: RealPrivateFilter;
  silent: boolean;
}
