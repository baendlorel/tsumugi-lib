import { assertKeys, clear, entries, iterate } from './core.js';

/**
 * A Map that uses an array of keys (a path) to map to a value.
 *
 * Internally it builds a tree of `Map` nodes. Only leaf nodes hold user values;
 * intermediate nodes are internal and not exposed as values.
 */
export class PathMap<K extends any[] = any[], V = any, NullType = undefined> {
  static readonly Null = Symbol('PathMap.Null');

  private map = new Map<any, any>();

  /**
   * Marks whether a map is created by this PathMap instance.
   */
  private internalMaps = new WeakSet<Map<any, any>>();

  private nullValue: NullType;

  constructor(entries?: Iterable<[K, V]>, nullValue?: any) {
    this.nullValue = nullValue;

    if (entries) {
      for (const [keys, value] of entries) {
        this.set(keys, value);
      }
    }
  }

  get(keys: K): V | NullType {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length; i++) {
      cur = cur.get(keys[i]);
      if (!this.internalMaps.has(cur)) {
        return i === keys.length - 1 ? (cur as V) : this.nullValue;
      }
    }
    return cur as V;
  }

  set(keys: K, value: V): this {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      let next = cur.get(keys[i]);
      if (!(next instanceof Map)) {
        this.internalMaps.add((next = new Map()));
        cur.set(keys[i], next);
      }
      cur = next;
    }
    cur.set(keys[keys.length - 1], value);
    return this;
  }

  has(keys: K): boolean {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length; i++) {
      cur = cur.get(keys[i]);
      if (cur === undefined) {
        return false;
      }
      if (!this.internalMaps.has(cur)) {
        return i === keys.length - 1;
      }
    }
    return true;
  }

  delete(keys: K): void {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      const next = cur.get(keys[i]);
      if (!this.internalMaps.has(next)) {
        return;
      }
      cur = next;
    }
    cur.delete(keys[keys.length - 1]);
  }

  forEach(callbackfn: (value: V, keys: K, map: PathMap<K, V>) => void, thisArg?: any): this {
    iterate(this.map, callbackfn as any, thisArg, [], this.internalMaps);
    return this;
  }

  clear(): this {
    clear(this.map, this.internalMaps);
    return this;
  }

  entries(): [K, V][] {
    return entries(this.map, this.internalMaps) as [K, V][];
  }

  values(): V[] {
    return this.entries().map((e) => e[1]);
  }

  keys(): K[] {
    return this.entries().map((e) => e[0]);
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    yield* this.entries();
  }

  get [Symbol.toStringTag](): string {
    return 'PathMap';
  }
}
