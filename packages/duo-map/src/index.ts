import { _getOrInsertComputed, _getOrInsert } from '@shared/std/map.js';

const MapConstruct = () => new Map();

/**
 * Creates a two-keyed map structure.
 *
 * @template K1 - The type of the first-level keys.
 * @template K2 - The type of the second-level keys.
 * @template V - The type of the values.
 */
export class DuoMap<K1 = any, K2 = any, V = any> {
  private map = new Map<K1, Map<K2, V>>();

  get size(): number {
    let count = 0;
    this.map.forEach((m) => (count += m.size));
    return count;
  }

  set(key1: K1, key2: K2, value: V): this {
    _getOrInsertComputed(this.map, key1, MapConstruct).set(key2, value);
    return this;
  }

  get(key1: K1, key2: K2): V | undefined {
    return this.map.get(key1)?.get(key2);
  }

  getOrInsert(key1: K1, key2: K2, value: V): V {
    const m = _getOrInsertComputed(this.map, key1, MapConstruct);
    return _getOrInsert(m, key2, value);
  }

  getOrInsertComputed(key1: K1, key2: K2, compute: (key1: K1, key2: K2) => V): V {
    const m = _getOrInsertComputed(this.map, key1, MapConstruct);
    return _getOrInsertComputed(m, key2, () => compute(key1, key2));
  }

  has(key1: K1, key2: K2): boolean {
    return this.map.get(key1)?.has(key2) ?? false;
  }

  delete(key1: K1, key2: K2): boolean {
    const m = this.map.get(key1);
    if (!m) {
      return false;
    }
    const result = m.delete(key2);
    if (m.size === 0) {
      this.map.delete(key1);
    }
    return result;
  }

  clear(): void {
    this.map.clear();
  }

  forEach(callback: (value: V, key1: K1, key2: K2) => void): void {
    this.map.forEach((m, key1) => m.forEach((value, key2) => callback(value, key1, key2)));
  }

  keys(): [K1, K2][] {
    const result: [K1, K2][] = [];
    this.map.forEach((m, key1) => m.forEach((_, key2) => result.push([key1, key2])));
    return result;
  }

  values(): V[] {
    const result: V[] = [];
    this.map.forEach((m) => m.forEach((value) => result.push(value)));
    return result;
  }

  entries(): [K1, K2, V][] {
    const result: [K1, K2, V][] = [];
    this.map.forEach((m, key1) => m.forEach((value, key2) => result.push([key1, key2, value])));
    return result;
  }

  [Symbol.iterator](): Iterator<[K1, K2, V]> {
    const entries = this.entries();
    let index = 0;
    return {
      next(): IteratorResult<[K1, K2, V]> {
        if (index < entries.length) {
          return { value: entries[index++], done: false };
        } else {
          return { value: undefined as any, done: true };
        }
      },
    };
  }
}

/**
 * Creates a three-keyed map structure.
 *
 * @template K1 - The type of the first-level keys.
 * @template K2 - The type of the second-level keys.
 * @template K3 - The type of the third-level keys.
 * @template V - The type of the values.
 */
export class TresMap<K1 = any, K2 = any, K3 = any, V = any> {
  private map = new Map<K1, Map<K2, Map<K3, V>>>();

  get size(): number {
    let count = 0;
    this.map.forEach((m) => m.forEach((m2) => (count += m2.size)));
    return count;
  }

  set(key1: K1, key2: K2, key3: K3, value: V): this {
    const m1 = _getOrInsertComputed(this.map, key1, MapConstruct);
    _getOrInsertComputed(m1, key2, MapConstruct).set(key3, value);
    return this;
  }

  get(key1: K1, key2: K2, key3: K3): V | undefined {
    return this.map.get(key1)?.get(key2)?.get(key3);
  }

  getOrInsert(key1: K1, key2: K2, key3: K3, value: V): V {
    const m1 = _getOrInsertComputed(this.map, key1, MapConstruct);
    const m2 = _getOrInsertComputed(m1, key2, MapConstruct);
    return _getOrInsert(m2, key3, value);
  }

  getOrInsertComputed(key1: K1, key2: K2, key3: K3, compute: (key1: K1, key2: K2, key3: K3) => V): V {
    const m1 = _getOrInsertComputed(this.map, key1, MapConstruct);
    const m2 = _getOrInsertComputed(m1, key2, MapConstruct);
    return _getOrInsertComputed(m2, key3, () => compute(key1, key2, key3));
  }

  has(key1: K1, key2: K2, key3: K3): boolean {
    return this.map.get(key1)?.get(key2)?.has(key3) ?? false;
  }

  delete(key1: K1, key2: K2, key3: K3): boolean {
    const m1 = this.map.get(key1);
    if (!m1) return false;
    const m2 = m1.get(key2);
    if (!m2) return false;
    const result = m2.delete(key3);
    if (m2.size === 0) {
      m1.delete(key2);
      if (m1.size === 0) {
        this.map.delete(key1);
      }
    }
    return result;
  }

  clear(): void {
    this.map.clear();
  }

  forEach(callback: (value: V, key1: K1, key2: K2, key3: K3) => void): void {
    this.map.forEach((m, key1) =>
      m.forEach((m2, key2) => m2.forEach((value, key3) => callback(value, key1, key2, key3))),
    );
  }

  keys(): [K1, K2, K3][] {
    const result: [K1, K2, K3][] = [];
    this.map.forEach((m, key1) => m.forEach((m2, key2) => m2.forEach((_, key3) => result.push([key1, key2, key3]))));
    return result;
  }

  values(): V[] {
    const result: V[] = [];
    this.map.forEach((m) => m.forEach((m2) => m2.forEach((value) => result.push(value))));
    return result;
  }

  entries(): [K1, K2, K3, V][] {
    const result: [K1, K2, K3, V][] = [];
    this.map.forEach((m, key1) =>
      m.forEach((m2, key2) => m2.forEach((value, key3) => result.push([key1, key2, key3, value]))),
    );
    return result;
  }

  [Symbol.iterator](): Iterator<[K1, K2, K3, V]> {
    const entries = this.entries();
    let index = 0;
    return {
      next(): IteratorResult<[K1, K2, K3, V]> {
        if (index < entries.length) {
          return { value: entries[index++], done: false };
        } else {
          return { value: undefined as any, done: true };
        }
      },
    };
  }
}
