import { Value, VK } from './value.js';

export function assertKeys(keys: unknown): asserts keys is any[] {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new TypeError('PathMap cannot operate with an empty key path');
  }
}

export function clear(map: Map<any, any>) {
  map.forEach((value) => {
    if (!(VK in value)) {
      clear(value);
    }
  });
  map.clear();
}

export function iterate(
  map: Map<any, any>,
  callbackfn: (value: any, keys: any[], map: Map<any, any>) => void,
  thisArg: any,
  keyStack: any[],
) {
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    if (VK in value) {
      callbackfn.call(thisArg, value[VK], nextKey, map);
    } else {
      iterate(value, callbackfn, thisArg, nextKey);
    }
  });
}

export function entries(map: Map<any, any>, keyStack: any[] = []): [any[], any][] {
  const result: [any[], any][] = [];
  map.forEach((value, key) => {
    const nextKey = keyStack.concat(key);
    if (VK in value) {
      result.push([nextKey, value[VK]]);
    } else {
      result.push(...entries(value, nextKey));
    }
  });
  return result;
}
