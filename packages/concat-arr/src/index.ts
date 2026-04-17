import { $concat, $filter, $isArray } from '@shared';

/**
 * ## Usage
 * Concatenates multiple arrays end-to-end.
 * - if some argument is not an array, it will be ignored.
 *   - this is filtered by `Array.isArray`.
 * - if no arguments are provided, it returns an empty array.
 * @param arrays - Arrays to concatenate.
 * @returns The concatenated array.
 *
 * __PKG_INFO__
 */
export function concatArr(...args: any[]): any[] {
  if (args.length === 0) {
    return [];
  }
  const b = $filter.call(args, $isArray);
  return $concat.apply([], b);
}
