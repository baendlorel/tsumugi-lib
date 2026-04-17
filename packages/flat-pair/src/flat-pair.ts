import { checkLength } from './errors.js';
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

export class FlatPair<K, V> {
  static from<T extends Map<any, any>>(map: T): T extends Map<infer K, infer V> ? FlatPair<K, V> : never {
    if (Object.prototype.toString.call(map) !== '[object Map]') {
      throw new TypeError('[__NAME__: __func__] Argument must be a Map');
    }

    const items: any[] = [];
    map.forEach((v, k) => items.push(k, v));
    return new FlatPair(items) as any;
  }

  private readonly _items: any[] = [];

  constructor(items: any[]) {
    const len = items.length;
    checkLength(len);
    this._items = items.slice();
  }

  get size() {
    return this._items.length / 2;
  }

  /**
   * A reference to the internal array
   * - associated with `this.findIndex`
   */
  get array() {
    return this._items;
  }

  /**
   * Will check if the key already exists, if so then do nothing.
   * - different from Map.set, **won't** change value if key exists
   */
  add(key: K, value: V): this {
    add<K, V>(this._items, key, value);
    return this;
  }

  /**
   * Same as Map.set
   */
  set(key: K, value: V): this {
    // update the value for an existing key if present
    set<K, V>(this._items, key, value);
    return this;
  }

  hasByValue(value: V): boolean {
    return hasByValue(this._items, value);
  }

  remove(key: K): boolean {
    return remove(this._items, key);
  }

  removeByValue(value: V): boolean {
    return removeByValue(this._items, value);
  }

  get(key: K): V | undefined {
    return get<K, V>(this._items, key);
  }

  getByValue(value: V): K | undefined {
    return getByValue<K, V>(this._items, value);
  }

  find(predicate: (value: V, key: K, index: number, array: any[]) => boolean): [K, V] | undefined {
    return find<K, V>(this._items, predicate);
  }

  findIndex(predicate: (value: V, key: K, index: number, array: any[]) => boolean): number {
    return findIndex<K, V>(this._items, predicate);
  }

  clear() {
    this._items.length = 0;
  }

  has(key: K): boolean {
    return has(this._items, key);
  }

  forEach(callback: (value: V, key: K, index: number, array: any[]) => void, thisArg?: any): void {
    forEach<K, V>(this._items, callback, thisArg);
  }

  *keys(): IterableIterator<K> {
    for (let i = 0; i < this._items.length; i += 2) {
      yield this._items[i] as K;
    }
  }

  *values(): IterableIterator<V> {
    for (let i = 1; i < this._items.length; i += 2) {
      yield this._items[i] as V;
    }
  }

  *entries(): IterableIterator<[K, V]> {
    for (let i = 0; i < this._items.length; i += 2) {
      yield [this._items[i] as K, this._items[i + 1] as V];
    }
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
