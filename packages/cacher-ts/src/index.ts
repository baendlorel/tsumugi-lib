const _null = Symbol();

const wrapAndThrow: (msg: string, e: unknown) => never = (msg, e) => {
  msg += e instanceof Error ? e.message : String(e);
  const err = new Error(msg);
  if ((e as Error)?.stack) {
    err.stack = (e as Error).stack;
  }
  throw err;
};

// TODO 依然存在深层的竞态条件，clear无法等待当前整个get完成，只是在等待pendingPromise结束。为此，要用version方法
export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = NaN;
  private cache: T | typeof _null = _null;
  private pendingPromise: Promise<T> | null = null;
  private clearAfterGet = false;

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

    if (isNaN(this.lastGetTime) || performance.now() - this.lastGetTime >= this.ttl) {
      try {
        this.pendingPromise = this.getter();
        cache = await this.pendingPromise;
      } catch (e) {
        wrapAndThrow(`Getter failed, cache restored to ${cache === _null ? 'null symbol' : 'old value'}.`, e);
      } finally {
        this.pendingPromise = null;
      }
    }

    this.cache = cache;
    this.lastGetTime = performance.now();
    if (this.clearAfterGet) {
      this.clearAfterGet = false;
      this.clear();
    }

    return cache as T;
  }

  /**
   * Set the cache value to null symbol(an internal value that means null, not to be confused with JavaScript's `null`).
   * - **Will lose current cache**
   * - If there is a pending getter, the cache will be cleared after it settles.
   */
  clear(): void {
    if (this.pendingPromise) {
      this.clearAfterGet = true;
      return;
    }
    this.cache = _null;
    this.lastGetTime = NaN;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  derive<TSub = any>(pureMapper: (value: T) => TSub): SubCacher<TSub> {
    return new SubCacher<TSub>(this, pureMapper);
  }
}

export class SubCacher<TSub = any> {
  private parentCache: any = _null;
  private cache: TSub | typeof _null = _null;

  private readonly map: (value: any) => TSub;
  private readonly parent: Cacher;

  /**
   * Must be a pure sync function.
   * It will be called without await.
   * @param parent Cacher that this sub-cacher is derived from
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  constructor(parent: Cacher, pureMapper: (value: any) => TSub) {
    this.parent = parent;
    this.map = pureMapper;
  }

  async get(): Promise<TSub> {
    const result = await this.parent.get();
    if (Object.is(this.parentCache, result)) {
      return this.cache as TSub;
    }

    const v = this.map(result) as any;
    if (typeof v?.then === 'function') {
      console.warn('mapFn is called without await, so this thenable result will be kept.');
    }
    this.cache = v;
    this.parentCache = result;
    return this.cache as TSub;
  }
}
