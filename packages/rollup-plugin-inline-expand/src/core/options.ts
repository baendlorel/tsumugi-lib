import type { RollupInlineFunctionOptions, NormalizedRollupInlineFunctionOptions } from '../types/common.js';

export function normalizeOptions(
  options: Partial<RollupInlineFunctionOptions>,
): NormalizedRollupInlineFunctionOptions {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`Invalid options: expected object, got '${options}'`);
  }

  const names = Array.isArray(options.names)
    ? [...new Set(options.names.filter((name): name is string => typeof name === 'string' && name.length > 0))]
    : [];

  return {
    names,
    include: options.include,
    exclude: options.exclude,
  };
}
