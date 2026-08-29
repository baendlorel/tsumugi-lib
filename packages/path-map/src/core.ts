import type { PathMap } from './index.js';
import { VK } from './value.js';

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
  pathMap: PathMap,
  node: Map<any, any>,
  keyStack: any[],
  thisArg: any,
  callbackfn: (value: any, keys: any[], map: PathMap) => void,
) {
  node.forEach((valueOrMap, key) => {
    const nextKey = keyStack.concat(key);
    if (VK in valueOrMap) {
      callbackfn.call(thisArg, valueOrMap[VK], nextKey, pathMap);
    } else {
      iterate(pathMap, valueOrMap, nextKey, thisArg, callbackfn);
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
