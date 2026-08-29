import { assertKeys, clear, entries, iterate } from './core.js';
import { Value, VK } from './value.js';

type DeepMap = Map<any, Value<any> | DeepMap>;

/**
 * A Map that uses an array of keys (a path) to map to a value.
 *
 * Internally it builds a tree of `Map` nodes. Only leaf nodes hold user values;
 * intermediate nodes are internal and not exposed as values.
 */
export class PathMap<K extends any[] = any[], V = any, NullType = undefined> {
  static readonly Null = Symbol('PathMap.Null');

  private map: DeepMap = new Map();

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
      const next = cur.get(keys[i]);
      if (!next) {
        return this.nullValue;
      } else if (VK in next) {
        // & 'VK in next' is far more faster then 'instanceof'
        return i === keys.length - 1 ? next[VK] : this.nullValue;
      } else {
        cur = next;
      }
    }
    return VK in cur ? (cur as Value<V>)[VK] : this.nullValue;
  }

  set(keys: K, value: V): this {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      let next = cur.get(keys[i]);
      // If it's a Value, then it will be overwritten.
      if (!next || VK in next) {
        next = new Map();
        cur.set(keys[i], next);
      }
      cur = next;
    }
    cur.set(keys[keys.length - 1], new Value(value));
    return this;
  }

  has(keys: K): boolean {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length; i++) {
      const next = cur.get(keys[i]);
      if (!next) {
        return false;
      } else if (VK in next) {
        return i === keys.length - 1;
      } else {
        cur = next;
      }
    }
    return cur instanceof Value;
  }

  delete(keys: K): void {
    assertKeys(keys);

    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      const next = cur.get(keys[i]);
      if (!next || VK in next) {
        return;
      }
      cur = next;
    }
    cur.delete(keys[keys.length - 1]);
  }

  forEach(callbackfn: (value: V, keys: K, map: PathMap<K, V>) => void, thisArg?: any): this {
    iterate(this.map, callbackfn as any, thisArg, []);
    return this;
  }

  clear(): this {
    clear(this.map);
    return this;
  }

  entries(): [K, V][] {
    return entries(this.map) as [K, V][];
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
