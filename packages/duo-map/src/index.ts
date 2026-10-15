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

  hasBy(key1: K1, key2?: K2): boolean;
  hasBy(...args: any[]) {
    if (args.length === 1) {
      return this.map.has(args[0]);
    }
    if (args.length === 2) {
      return this.map.get(args[0])?.has(args[1]) ?? false;
    }
    return false;
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

  deleteBy(key1: K1, key2?: K2): boolean;
  deleteBy(...args: any[]): boolean {
    if (args.length === 1) {
      const key1 = args[0];
      return this.map.delete(key1);
    }
    if (args.length === 2) {
      const key1 = args[0];
      const key2 = args[1];
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
    return false;
  }

  clear(): void {
    this.map.clear();
  }

  forEach(callback: (value: V, key1: K1, key2: K2) => void): void {
    this.map.forEach((m, key1) => m.forEach((value, key2) => callback(value, key1, key2)));
  }

  keys(key1?: K1): IterableIterator<[K1, K2]>;
  *keys(...args: any[]): IterableIterator<[K1, K2]> {
    if (args.length === 0) {
      for (const [key1, m] of this.map) {
        for (const key2 of m.keys()) {
          yield [key1, key2];
        }
      }
    } else if (args.length === 1) {
      const key1 = args[0];
      const m = this.map.get(key1);
      if (m) {
        for (const key2 of m.keys()) {
          yield [key1, key2];
        }
      }
    }
  }

  values(key1?: K1): IterableIterator<V>;
  *values(...args: any[]): IterableIterator<V> {
    if (args.length === 0) {
      for (const m of this.map.values()) {
        yield* m.values();
      }
    } else if (args.length === 1) {
      const key1 = args[0];
      const m = this.map.get(key1);
      if (m) {
        yield* m.values();
      }
    }
  }

  entries(key1?: K1): IterableIterator<[K1, K2, V]>;
  *entries(...args: any[]): IterableIterator<[K1, K2, V]> {
    if (args.length === 0) {
      for (const [key1, m] of this.map) {
        for (const [key2, value] of m) {
          yield [key1, key2, value];
        }
      }
    } else if (args.length === 1) {
      const key1 = args[0];
      const m = this.map.get(key1);
      if (m) {
        for (const [key2, value] of m) {
          yield [key1, key2, value];
        }
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<[K1, K2, V]> {
    yield* this.entries();
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

  hasBy(key1: K1, key2?: K2, key3?: K3): boolean;
  hasBy(...args: any[]): boolean {
    if (args.length === 1) {
      return this.map.has(args[0]);
    } else if (args.length === 2) {
      return this.map.get(args[0])?.has(args[1]) ?? false;
    } else if (args.length === 3) {
      return this.map.get(args[0])?.get(args[1])?.has(args[2]) ?? false;
    }
    return false;
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

  deleteBy(key1: K1, key2?: K2, key3?: K3): boolean;
  deleteBy(...args: any[]): boolean {
    if (args.length === 1) {
      return this.map.delete(args[0]);
    } else if (args.length === 2) {
      const m1 = this.map.get(args[0]);
      if (!m1) {
        return false;
      }
      const result = m1.delete(args[1]);
      if (m1.size === 0) {
        this.map.delete(args[0]);
      }
      return result;
    } else if (args.length === 3) {
      const m1 = this.map.get(args[0]);
      if (!m1) {
        return false;
      }
      const m2 = m1.get(args[1]);
      if (!m2) {
        return false;
      }
      const result = m2.delete(args[2]);
      if (m2.size === 0) {
        m1.delete(args[1]);
        if (m1.size === 0) {
          this.map.delete(args[0]);
        }
      }
      return result;
    }
    return false;
  }

  clear(): void {
    this.map.clear();
  }

  forEach(callback: (value: V, key1: K1, key2: K2, key3: K3) => void): void {
    this.map.forEach((m, key1) =>
      m.forEach((m2, key2) => m2.forEach((value, key3) => callback(value, key1, key2, key3))),
    );
  }

  *keys(): IterableIterator<[K1, K2, K3]> {
    for (const [key1, m1] of this.map) {
      for (const [key2, m2] of m1) {
        for (const key3 of m2.keys()) {
          yield [key1, key2, key3];
        }
      }
    }
  }

  *values(): IterableIterator<V> {
    for (const m1 of this.map.values()) {
      for (const m2 of m1.values()) {
        yield* m2.values();
      }
    }
  }

  *entries(): IterableIterator<[K1, K2, K3, V]> {
    for (const [key1, m1] of this.map) {
      for (const [key2, m2] of m1) {
        for (const [key3, value] of m2) {
          yield [key1, key2, key3, value];
        }
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<[K1, K2, K3, V]> {
    yield* this.entries();
  }
}
