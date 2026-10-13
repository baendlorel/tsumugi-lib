/**
 * # 这是用pending promise和clear after promise来解决竞争问题的方案
 */

const _null = Symbol();

const wrapAndThrow: (msg: string, e: unknown) => never = (msg, e) => {
  msg += e instanceof Error ? e.message : String(e);
  const err = new Error(msg);
  if ((e as Error)?.stack) {
    err.stack = (e as Error).stack;
  }
  throw err;
};

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = NaN;
  private cache: T | typeof _null = _null;
  private pendingPromise: Promise<T> | null = null;
  private clearAfterPromise: Promise<T> | null = null;

  private subCache = new Map<string, { cache: any; mapper: (value: T) => any }>();

  /**
   * Create a cacher instance.
   * @param getter Must contain a promise-returning function that eventually settles.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  /**
   * Getter of the value.
   */
  async get(): Promise<T> {
    if (this.pendingPromise) {
      return this.pendingPromise;
    }

    let cache = this.cache;

    let currentPendingPromise: Promise<T> | null = null;

    if (isNaN(this.lastGetTime) || performance.now() - this.lastGetTime >= this.ttl) {
      try {
        currentPendingPromise = this.getter();
        this.pendingPromise = currentPendingPromise;
        cache = await currentPendingPromise;
        this.lastGetTime = performance.now();
      } catch (e) {
        this.clearIfNeeded(currentPendingPromise);
        wrapAndThrow(`Getter failed, cache restored to ${cache === _null ? 'null symbol' : 'old value'}.`, e);
      } finally {
        this.pendingPromise = null;
      }
    }

    this.cache = cache;
    this.clearIfNeeded(currentPendingPromise);

    return cache as T;
  }

  private clearIfNeeded(currentPendingPromise: Promise<T> | null): void {
    if (currentPendingPromise && this.clearAfterPromise === currentPendingPromise) {
      this.clearAfterPromise = null;
      this.cache = _null;
      this.lastGetTime = NaN;
    }
  }

  /**
   * Set the cache value to null symbol(an internal value that means null, not to be confused with JavaScript's `null`).
   * - **Will lose current cache**
   * - If there is a pending getter, the cache will be cleared after it settles.
   */
  clear(): void {
    if (this.pendingPromise) {
      this.clearAfterPromise = this.pendingPromise;
      return;
    }
    this.cache = _null;
    this.lastGetTime = NaN;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  derive<TSub = any>(name: string, pureMapper: (value: T) => TSub): void {
    this.subCache.set(name, { cache: _null, mapper: pureMapper });
  }

  getSub<TSub = any>(name: string): TSub | typeof _null {
    const sub = this.subCache.get(name);
    if (!sub) {
      return _null;
    }
    if (sub.cache === _null && this.cache !== _null) {
      sub.cache = sub.mapper(this.cache as T);
    }
    return sub.cache as TSub;
  }
}
