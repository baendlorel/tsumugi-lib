const _null = Symbol();
export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = NaN;
  private cache: T | typeof _null = _null;
  private pendingPromise: Promise<T> | null = null;

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
    if (isNaN(this.lastGetTime) || Date.now() - this.lastGetTime >= this.ttl || Date.now() < this.lastGetTime) {
      try {
        this.pendingPromise = this.getter();
        this.cache = await this.pendingPromise;
        this.lastGetTime = Date.now();
      } finally {
        this.pendingPromise = null;
      }
    }
    return this.cache as T;
  }

  async clear() {
    if (this.pendingPromise) {
      await this.pendingPromise;
    }
    this.cache = _null;
    this.lastGetTime = NaN;
  }

  /**
   * Derives a new cacher from the current one by applying a mapping function to its value.
   * @param mapFn The mapping function to apply to the current cacher's value.
   * @returns A new cacher that holds the mapped value.
   */
  derive<TSub = any>(mapFn: (value: T) => TSub): SubCacher<TSub> {
    return new SubCacher<TSub>(this, mapFn);
  }
}

export class SubCacher<TSub = any> {
  private parentCache: any = _null;
  private cache: TSub | typeof _null = _null;

  constructor(
    private readonly parent: Cacher,
    /**
     * Must be a pure sync function.
     * It will be called without await.
     */
    private readonly mapFn: (value: any) => TSub,
  ) {}

  async get(): Promise<TSub> {
    const result = await this.parent.get();
    if (Object.is(this.parentCache, result)) {
      return this.cache as TSub;
    }

    const v = this.mapFn(result) as any;
    if (typeof v?.then === 'function') {
      console.warn('mapFn is called without await, so this thenable result will be kept.');
    }
    this.cache = v;
    this.parentCache = result;
    return this.cache as TSub;
  }
}
