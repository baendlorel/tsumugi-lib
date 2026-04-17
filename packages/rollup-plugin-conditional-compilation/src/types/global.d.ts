import type { ECMA_VERSIONS } from '../misc/consts.js';

export interface RollupConditionalCompilationOptions {
  /**
   * Variables to be used in the expressions `#if` or `#elif`
   */
  variables: Record<string, unknown>;

  /**
   * Will be passed to Acorn
   * - default: 'module'
   */
  sourceType: 'script' | 'module';

  /**
   * Will be passed to Acorn
   * - default: 'latest'
   */
  ecmaVersion: (typeof ECMA_VERSIONS)[number];

  /**
   * Cache compiled expression functions by expression string.
   * - default: true
   */
  expressionCache: boolean;
}
