import { $is, $isArray } from '@shared';
import type { Class } from './global.js';
import { getAllKeys } from './get-all-keys.js';

type Like = <T extends Class>(protoClass: T, o: any) => o is InstanceType<T>;

/**
 * Deeply compare two values for equality.
 * Uses Object.is for primitive values.
 * Supports objects, arrays, Map, Set, Date, RegExp, etc.
 * @param a
 * @param b
 */
export function deepEqual(a: any, b: any, likeInstanceOf: Like): boolean {
  if (typeof a !== typeof b) {
    return false;
  }
  if ($is(a, b)) {
    return true;
  } else if (typeof a !== 'object') {
    // rest of the types can be compared directly
    return false;
  }

  if (a === null && b !== null) {
    return false;
  }

  if (b === null && a !== null) {
    return false;
  }

  // Date
  if (likeInstanceOf(Date, a) && likeInstanceOf(Date, b)) {
    return a.getTime() === b.getTime();
  }
  // RegExp
  if (likeInstanceOf(RegExp, a) && likeInstanceOf(RegExp, b)) {
    return a.source === b.source && a.flags === b.flags;
  }
  // Array
  if ($isArray(a) && $isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], likeInstanceOf)) {
        return false;
      }
    }
    return true;
  }
  // Map
  if (likeInstanceOf(Map, a) && likeInstanceOf(Map, b)) {
    if (a.size !== b.size) {
      return false;
    }
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEqual(v, b.get(k), likeInstanceOf)) {
        return false;
      }
    }
    return true;
  }
  // Set
  if (likeInstanceOf(Set, a) && likeInstanceOf(Set, b)) {
    if (a.size !== b.size) {
      return false;
    }
    for (const v of a) {
      // Set: must have a deepEqual value in b
      let found = false;
      for (const bv of b) {
        if (deepEqual(v, bv, likeInstanceOf)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  }

  // Object
  const aKeys = [...getAllKeys(a)];
  const bKeys = [...getAllKeys(b)];
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    if (!deepEqual(a[k], b[k], likeInstanceOf)) {
      return false;
    }
  }
  return true;
}
