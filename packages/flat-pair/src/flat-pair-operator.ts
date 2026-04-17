import {
  add,
  set,
  remove,
  get,
  getByValue,
  find,
  findIndex,
  removeByValue,
  forEach,
  has,
  hasByValue,
} from './operators.js';

/**
 * Creates an static operator
 */
export class FlatPairOperator<K, V> {
  /**
   * Will check if the key already exists, if so then do nothing.
   * - different from Map.set, **won't** change value if key exists
   */
  add(items: any[], key: K, value: V): void {
    add(items, key, value);
  }

  /**
   * Same as Map.set
   */
  set(items: any[], key: K, value: V): void {
    set(items, key, value);
  }

  remove(items: any[], key: K): boolean {
    return remove(items, key);
  }

  get(items: any[], key: K): V | undefined {
    return get(items, key);
  }

  getByValue(items: any[], value: V): K | undefined {
    return getByValue(items, value);
  }

  find(
    items: any[],
    predicate: (value: V, key: K, index: number, array: any[]) => boolean
  ): [K, V] | undefined {
    return find<K, V>(items, predicate);
  }

  findIndex(
    items: any[],
    predicate: (value: V, key: K, index: number, array: any[]) => boolean
  ): number {
    return findIndex<K, V>(items, predicate);
  }

  removeByValue(items: any[], value: V): boolean {
    return removeByValue(items, value);
  }

  forEach(
    items: any[],
    callback: (value: V, key: K, index: number, array: any[]) => void,
    thisArg?: any
  ): void {
    forEach(items, callback, thisArg);
  }

  *keys(items: any[]): IterableIterator<K> {
    for (let i = 0; i < items.length; i += 2) {
      yield items[i] as K;
    }
  }

  *values(items: any[]): IterableIterator<V> {
    for (let i = 1; i < items.length; i += 2) {
      yield items[i] as V;
    }
  }

  *entries(items: any[]): IterableIterator<[K, V]> {
    for (let i = 0; i < items.length; i += 2) {
      yield [items[i] as K, items[i + 1] as V];
    }
  }

  clear(items: any[]): void {
    items.length = 0;
  }

  has(items: any[], key: K): boolean {
    return has(items, key);
  }

  hasByValue(items: any[], value: V): boolean {
    return hasByValue(items, value);
  }
}
