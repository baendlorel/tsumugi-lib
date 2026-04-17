import { $ownKeys, $getPrototypeOf } from '@shared';

export function getAllKeys(o: any) {
  let p = o;
  const keys = new Set<string | symbol>();
  while (p !== null) {
    $ownKeys(p).forEach((k) => keys.add(k));
    p = $getPrototypeOf(p);
  }
  return keys;
}
