import { $isArray } from '@shared';

// # utils
export function isPrimitive(o: unknown) {
  return (typeof o !== 'object' || o === null) && typeof o !== 'function';
}

export function expectTarget(fnName: string, o: unknown) {
  if (isPrimitive(o)) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-object target: ${o}`);
  }
}

export function expectTargetAndKeys(fnName: string, o: unknown, keys: PropertyKey[]) {
  if (isPrimitive(o)) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-object target: ${o}`);
  }
  if (!$isArray(keys)) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-array keys`);
  }
  if (keys.length === 0) {
    throw new TypeError(`[__NAME__] ${fnName} called with empty array of keys`);
  }
}
