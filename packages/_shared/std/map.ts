// # Map
export const _getOrInsert = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  if (!map.has(key)) {
    map.set(key, value);
  }
  return map.get(key)!;
};

export const _getOrInsertComputed = <K, V>(map: Map<K, V>, key: K, compute: (key: K) => V): V => {
  if (!map.has(key)) {
    map.set(key, compute(key));
  }
  return map.get(key)!;
};

// # WeakMap
export const _weakGetOrInsert = <K extends WeakKey, V>(map: WeakMap<K, V>, key: K, value: V): V => {
  if (!map.has(key)) {
    map.set(key, value);
  }
  return map.get(key)!;
};

export const _weakGetOrInsertComputed = <K extends WeakKey, V>(
  map: WeakMap<K, V>,
  key: K,
  compute: (key: K) => V,
): V => {
  if (!map.has(key)) {
    map.set(key, compute(key));
  }
  return map.get(key)!;
};
