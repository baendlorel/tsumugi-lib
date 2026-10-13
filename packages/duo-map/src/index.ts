const MapConstruct = () => new Map();

export class DuoMap<K1 = any, K2 = any, V = any> {
  private map = new Map<K1, Map<K2, V>>();

  get size(): number {
    let count = 0;
    this.map.forEach((m) => (count += m.size));
    return count;
  }

  set(key1: K1, key2: K2, value: V): this {
    this.map.getOrInsertComputed(key1, MapConstruct).set(key2, value);
    return this;
  }

  get(key1: K1, key2: K2): V | undefined {
    return this.map.get(key1)?.get(key2);
  }

  getOrInsert(key1: K1, key2: K2, value: V): V {
    return this.map.getOrInsertComputed(key1, MapConstruct).getOrInsert(key2, value);
  }

  getOrInsertComputed(key1: K1, key2: K2, compute: (key1: K1, key2: K2) => V): V {
    return this.map.getOrInsertComputed(key1, MapConstruct).getOrInsertComputed(key2, () => compute(key1, key2));
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
