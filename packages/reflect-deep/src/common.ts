// # utils
export function expectTarget(fnName: string, o: unknown) {
  if (o === null || o === undefined) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-object target: ${o}`);
  }
}

export function expectTargetAndKeys(fnName: string, o: unknown, keys: PropertyKey[]) {
  if (o === null || o === undefined) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-object target: ${o}`);
  }
  if (!Array.isArray(keys)) {
    throw new TypeError(`[__NAME__] ${fnName} called with non-array keys`);
  }
  if (keys.length === 0) {
    throw new TypeError(`[__NAME__] ${fnName} called with empty array of keys`);
  }
}
