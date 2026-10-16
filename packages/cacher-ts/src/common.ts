export const empty = Symbol();
export type empty = typeof empty;

export const infinityBigInt = -1n;

/**
 * - Must be a non-negative number or bigint.
 * - Cannot be `NaN`, can be `Infinity`.
 */
export function validTTL(ttl: unknown): bigint {
  if (ttl === infinityBigInt || ttl === Infinity || ttl === undefined) {
    return infinityBigInt;
  }

  if (typeof ttl === 'number') {
    if (!Number.isSafeInteger(ttl) || ttl < 0) {
      throw new TypeError(`ttl must be a non-negative number or bigint.`);
    }

    return BigInt(ttl);
  }

  if (typeof ttl === 'bigint') {
    if (ttl < 0n) {
      throw new TypeError(`ttl must be a non-negative number or bigint.`);
    }
    return ttl;
  }

  throw new TypeError(`ttl must be a non-negative number or bigint.`);
}
