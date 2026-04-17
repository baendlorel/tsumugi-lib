import type { FilterPattern } from '@rollup/pluginutils';

export interface RollupInlineFunctionOptions {
  /**
   * Function names to expand.
   */
  names: string[];

  /**
   * Rollup filter include option.
   */
  include?: FilterPattern;

  /**
   * Rollup filter exclude option.
   */
  exclude?: FilterPattern;
}

export interface NormalizedRollupInlineFunctionOptions {
  names: string[];
  include?: FilterPattern;
  exclude?: FilterPattern;
}
