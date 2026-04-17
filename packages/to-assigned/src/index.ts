import { $assign } from '@shared';

export const isObject = (v: unknown): v is object => v !== null && typeof v === 'object';

/**
 * ## Usage
 * A pure function version of `Object.assign`.
 * Use to merge objects like `toAssigned(obj1, obj2)`(obj1 is not changed).
 * - Ignores variables that are not `object`.
 * - Only enumerable properties (including symbol keys) are copied from all sources.
 *
 * @returns A new object.
 *
 * __PKG_INFO__
 */
export function toAssigned(...sources: any[]): any {
  sources = sources.filter(isObject);
  if (sources.length === 0) {
    return {};
  }
  return $assign({}, ...sources);
}
