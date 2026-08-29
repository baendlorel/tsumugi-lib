export function assertKeys(keys: unknown): asserts keys is any[] {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new TypeError('PathMap cannot operate with an empty key path');
  }
}

export function clear(map: Map<any, any>, internalMaps: WeakSet<Map<any, any>>) {
  map.forEach((value) => {
    if (internalMaps.has(value)) {
      clear(value, internalMaps);
    }
  });
  map.clear();
}

export function iterate(
  map: Map<any, any>,
  callbackfn: (value: any, keys: any[], map: Map<any, any>) => void,
  thisArg: any,
  keyStack: any[],
  internalMaps: WeakSet<Map<any, any>>,
) {
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    callbackfn.call(thisArg, value, nextKey, map);
    if (internalMaps.has(value)) {
      iterate(value, callbackfn, thisArg, nextKey, internalMaps);
    }
  });
}

export function entries(
  map: Map<any, any>,
  internalMaps: WeakSet<Map<any, any>>,
  keyStack: any[] = [],
): [any[], any][] {
  const result: [any[], any][] = [];
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    if (internalMaps.has(value)) {
      result.push(...entries(value, internalMaps, nextKey));
    } else {
      result.push([nextKey, value]);
    }
  });
  return result;
}
