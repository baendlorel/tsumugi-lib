import { checkLength } from './errors.js';

const $is = function SameValueZero(x: any, y: any): boolean {
  if (x === y) {
    // +0 equals -0
    return true;
  }
  // NaN check
  return x !== x && y !== y;
};

export function size(items: any[]): number {
  const len = items.length;
  checkLength(len);
  return len / 2;
}

/**
 * Will check if the key already exists, if so then do nothing.
 * - different from Map.set, **won't** change value if key exists
 */
export function add<K, V>(items: any[], key: K, value: V): void {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if ($is(items[i], key)) {
      return;
    }
  }
  items.push(key, value);
}

/**
 * Same as Map.set
 */
export function set<K, V>(items: any[], key: K, value: V): void {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if ($is(items[i], key)) {
      items[i + 1] = value;
      return;
    }
  }
  items.push(key, value);
}

export function has<K>(items: any[], key: K): boolean {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if ($is(items[i], key)) {
      return true;
    }
  }
  return false;
}

export function hasByValue<V>(items: any[], value: V): boolean {
  const len = items.length;
  checkLength(len);
  for (let i = 1; i < len; i += 2) {
    if ($is(items[i], value)) {
      return true;
    }
  }
  return false;
}

export function get<K, V>(items: any[], key: K): V | undefined {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if ($is(items[i], key)) {
      return items[i + 1];
    }
  }
  return undefined;
}

export function getByValue<K, V>(items: any[], value: V): K | undefined {
  const len = items.length;
  checkLength(len);
  for (let i = 1; i < len; i += 2) {
    if ($is(items[i], value)) {
      return items[i - 1];
    }
  }
  return undefined;
}

export function remove<K>(items: any[], key: K): boolean {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if ($is(items[i], key)) {
      items.splice(i, 2);
      return true;
    }
  }
  return false;
}

export function removeByValue<V>(items: any[], value: V): boolean {
  const len = items.length;
  checkLength(len);
  for (let i = 1; i < len; i += 2) {
    if ($is(items[i], value)) {
      items.splice(i - 1, 2);
      return true;
    }
  }
  return false;
}

/**
 * Behaviors are similar to `Array.prototype.forEach`, caches length and checks index existence.
 *
 * - `callback`: index is the index of array, not the pair count.
 */
export function forEach<K, V>(
  items: any[],
  callback: (value: V, key: K, index: number, array: any[]) => void,
  thisArg?: any,
): void {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    if (i in items) {
      callback.call(thisArg, items[i + 1] as V, items[i] as K, i, items);
    }
  }
}

export function clear(items: any[]): void {
  items.length = 0;
}

export function find<K, V>(
  items: any[],
  predicate: (value: V, key: K, index: number, array: any[]) => boolean,
): [K, V] | undefined {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    const found = predicate(items[i + 1] as V, items[i] as K, i, items);
    if (found) {
      return [items[i] as K, items[i + 1] as V];
    }
  }
  return undefined;
}

export function findIndex<K, V>(
  items: any[],
  predicate: (value: V, key: K, index: number, array: any[]) => boolean,
): number {
  const len = items.length;
  checkLength(len);
  for (let i = 0; i < len; i += 2) {
    const found = predicate(items[i + 1] as V, items[i] as K, i, items);
    if (found) {
      return i;
    }
  }
  return -1;
}
