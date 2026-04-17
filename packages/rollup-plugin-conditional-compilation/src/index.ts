import type { Plugin } from 'rollup';
import type { RollupConditionalCompilationOptions } from './types/global.js';
import { ECMA_VERSIONS, SOURCE_TYPES } from './misc/consts.js';
import { parse } from './core/parse.js';
import { apply } from './core/transform.js';

/**
 * ## Usage
 * Using `// #if` and `// #endif` to do the conditional compilation like C++!
 * @param options options of the plugin
 *
 * __PKG_INFO__
 */
export default function conditionalCompilation(options: Partial<RollupConditionalCompilationOptions> = {}): Plugin {
  const opts = normalize(options);

  return {
    name: '__KEBAB_NAME__',
    transform(code: string, id: string) {
      try {
        if (!code.includes('#if')) {
          return null;
        }

        const ifNodes = parse(code);
        if (ifNodes.length === 0) {
          return null;
        }

        const result = apply(code, ifNodes, opts.variables, { filename: id });

        return {
          code: result.code,
          map: result.map,
        };
      } catch (error) {
        console.error('parsing error occured:', error);
        this.error(`error in ${id} - ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}

function normalize(options: Partial<RollupConditionalCompilationOptions>): RollupConditionalCompilationOptions {
  if (typeof options !== 'object' || options === null) {
    throw new Error(`Invalid options: '${options}', must be an object`);
  }

  const { variables = {}, ecmaVersion = 'latest', sourceType = 'module', expressionCache = true } = options;

  if (typeof variables !== 'object' || variables === null) {
    throw new Error(`Invalid variables: '${variables}', must be an object`);
  }

  if (!ECMA_VERSIONS.includes(ecmaVersion)) {
    throw new Error(`Invalid ecmaVersion: '${ecmaVersion}', must be one of ${ECMA_VERSIONS.join(',')}`);
  }

  if (!SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid sourceType: '${sourceType}', must be one of ${SOURCE_TYPES.join(',')}`);
  }

  if (typeof expressionCache !== 'boolean') {
    throw new Error(`Invalid expressionCache: '${expressionCache}', must be a boolean`);
  }

  return { variables, ecmaVersion, sourceType, expressionCache };
}
