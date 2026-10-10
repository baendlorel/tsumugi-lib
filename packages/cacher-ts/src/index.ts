const empty = Symbol();
type empty = typeof empty;

interface SubCacheEntry<T, TSub = any> {
  /**
   * Current cache
   */
  cache: TSub | empty;

  /**
   * Parent Cache
   */
  parent: T | empty;

  /**
   * Mapping function. Must be pure.
   */
  fn: (value: T) => TSub;
}

export class Cacher<T = any> {
  /**
   * @internal
   */
  private readonly getter: () => Promise<T>;
  /**
   * @internal
   */
  private readonly ttl: number;

  /**
   * Last get time
   * @internal
   */
  private last: number = 0;
  /**
   * @internal
   */
  private cache: T | empty = empty;
  /**
   * @internal
   */
  private pending: Promise<T> | false = false;

  /**
   * @internal
   */
  private sub = new Map<string, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter An async value getter. **We trust you to handle the errors**.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  /**
   * Always awaits the loading getter to be settled.
   */
  async load(): Promise<void> {
    // # Not fetching immediately at the cache's expiration, only start the reloading process.

    if (this.pending) {
      // already pending
      await this.pending;
      return;
    }

    try {
      this.pending = this.getter();
      this.cache = await this.pending;
      this.last = performance.now();
    } finally {
      this.pending = false;
    }
  }

  /**
   * Returns the current loading promise for the cached value, or `false` if no reload is in progress.
   */
  get loading(): Promise<T> | false {
    return this.pending;
  }

  /**
   * Getter of the value.
   * If the cached value is outdated, it will trigger the initialization.
   */
  get(): T {
    if (this.cache === empty) {
      throw new Error('Cache is empty and has not been initialized yet.');
    }

    if (this.last === 0 || performance.now() - this.last >= this.ttl) {
      this.load();
    }
    return this.cache as T;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  derive<TSub = any>(name: string, pureMapper: (value: T) => TSub): void {
    this.sub.set(name, { cache: empty, parent: empty, fn: pureMapper });
  }

  remove(name: string): boolean {
    return this.sub.delete(name);
  }

  getSub<TSub = any>(name: string): TSub {
    const sub = this.sub.get(name);
    if (!sub) {
      throw new Error(`No derived cache with name "${name}".`);
    }

    if (Object.is(sub.parent, this.cache)) {
      if (sub.parent === empty) {
        throw new Error('Cache is not initialized yet.');
      }
      return sub.cache as TSub;
    }

    const parent = this.cache as T;
    const cache = sub.fn(parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}

export class CacherSync<T = any> {
  /**
   * @internal
   */
  private readonly getter: () => T;
  /**
   * @internal
   */
  private readonly ttl: number;

  /**
   * @internal
   */
  private lastGetTime: number = 0;
  /**
   * @internal
   */
  private cache: T | empty = empty;

  /**
   * @internal
   */
  private sub = new Map<string, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter Value getter.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => T, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  load(): void {
    this.cache = this.getter();
    this.lastGetTime = performance.now();
  }

  /**
   * Getter of the value.
   * If the cached value is outdated, it will trigger the initialization.
   */
  get(): T {
    if (this.lastGetTime === 0 || performance.now() - this.lastGetTime >= this.ttl) {
      this.load();
    }
    return this.cache as T;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  derive<TSub = any>(name: string, pureMapper: (value: T) => TSub): void {
    this.sub.set(name, { cache: empty, parent: empty, fn: pureMapper });
  }

  remove(name: string): boolean {
    return this.sub.delete(name);
  }

  getSub<TSub = any>(name: string): TSub {
    const sub = this.sub.get(name);
    if (!sub) {
      throw new Error(`Derived cache with name "${name}" does not exist.`);
    }

    if (Object.is(sub.parent, this.cache)) {
      if (sub.parent === empty) {
        throw new Error('Cache is empty and has not been initialized yet.');
      }
      return sub.cache as TSub;
    }

    const parent = this.cache as T;
    const cache = sub.fn(parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}
