const empty = Symbol();
type empty = typeof empty;

interface SubCacheEntry<T, TSub = any> {
  cache: TSub | empty;
  parent: T | empty;
  mapper: (value: T) => TSub;
}

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = 0;
  private cache: T | empty = empty;
  private getterPromise: Promise<T> | false = false;

  private subCache = new Map<string, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter An async value getter. **We trust you to handle the errors**.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
    // no longer automatically loading the cache upon construction.
    // users should load the cache manually by calling `load()`.
  }

  /**
   * Always awaits the pending getter to be settled.
   */
  async load(): Promise<void> {
    // # Not fetching immediately at the cache's expiration, only start the reloading process.

    if (this.getterPromise) {
      // already pending
      await this.getterPromise;
      return;
    }

    try {
      this.getterPromise = this.getter();
      this.cache = await this.getterPromise;
      this.lastGetTime = performance.now();
    } finally {
      this.getterPromise = false;
    }
  }

  /**
   * Returns the current pending promise for the cached value, or `false` if no reload is in progress.
   */
  get pending(): Promise<T> | false {
    return this.getterPromise;
  }

  /**
   * Getter of the value.
   * If the cached value is outdated, it will trigger the initialization.
   */
  get(): T {
    if (this.cache === empty) {
      throw new Error('Cache is empty and has not been initialized yet.');
    }

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
    this.subCache.set(name, { cache: empty, parent: empty, mapper: pureMapper });
  }

  remove(name: string): boolean {
    return this.subCache.delete(name);
  }

  getSub<TSub = any>(name: string): TSub {
    const sub = this.subCache.get(name);
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
    const cache = sub.mapper(parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}

export class CacherSync<T = any> {
  private readonly getter: () => T;
  private readonly ttl: number;

  private lastGetTime: number = 0;
  private cache: T | empty = empty;

  private subCache = new Map<string, SubCacheEntry<T, any>>();

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
    this.subCache.set(name, { cache: empty, parent: empty, mapper: pureMapper });
  }

  remove(name: string): boolean {
    return this.subCache.delete(name);
  }

  getSub<TSub = any>(name: string): TSub {
    const sub = this.subCache.get(name);
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
    const cache = sub.mapper(parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}
