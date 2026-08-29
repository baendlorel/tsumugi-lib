function clear(map: Map<any, any>, interalMaps: WeakSet<Map<any, any>>) {
  map.forEach((value) => {
    if (interalMaps.has(value)) {
      clear(value, interalMaps);
    }
  });
  map.clear();
}

function iterate(
  map: Map<any, any>,
  callbackfn: (value: any, keys: any[], map: Map<any, any>) => void,
  thisArg: any = map,
  keyStack: any[] = [],
  interalMaps: WeakSet<Map<any, any>>,
) {
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    callbackfn.call(thisArg, value, nextKey, map);
    if (interalMaps.has(value)) {
      iterate(value, callbackfn, thisArg, nextKey, interalMaps);
    }
  });
}

function entries(map: Map<any, any>, interalMaps: WeakSet<Map<any, any>>, keyStack: any[] = []): [any[], any][] {
  const result: [any[], any][] = [];
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    if (interalMaps.has(value)) {
      result.push(...entries(value, interalMaps, nextKey));
    } else {
      result.push([nextKey, value]);
    }
  });
  return result;
}

/**
 * This is a Map that use an array of keys to map to a value.
 */
export class PathMap<K extends any[] = any[], V extends any = any> {
  private map = new Map<any, any>();

  /**
   * Marks whether a map is created by this PathMap instance.
   */
  private internalMaps = new WeakSet<Map<any, any>>();

  get<V = any>(keys: K): V | undefined {
    let cur = this.map;
    for (let i = 0; i < keys.length; i++) {
      cur = cur.get(keys[i]);
      if (cur instanceof Map === false) {
        return i === keys.length - 1 ? (cur as V) : undefined;
      }
    }
    return cur as V;
  }

  set(keys: K, value: V): this {
    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      let next = cur.get(keys[i]);
      if (next instanceof Map === false) {
        this.internalMaps.add((next = new Map()));
        cur.set(keys[i], next);
      }
      cur = next;
    }
    cur.set(keys[keys.length - 1], value);
    return this;
  }

  delete(keys: K) {
    let cur = this.map;
    for (let i = 0; i < keys.length - 1; i++) {
      let next = cur.get(keys[i]);
      if (next instanceof Map === false) {
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

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries()[Symbol.iterator]();
  }

  [Symbol.toStringTag]() {
    return 'PathMap';
  }
}
