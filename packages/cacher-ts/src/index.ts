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
  private getterPromise!: Promise<T>;

  private subCache = new Map<string, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter Must contain a promise-returning function that eventually settles.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
    this.reload();
  }

  async reload(): Promise<void> {
    this.getterPromise = this.getter();
    this.cache = await this.getterPromise;
    this.lastGetTime = performance.now();
  }

  /**
   * This is the promise returned from `getter`.
   * Await it to make sure the cache is initialized.
   */
  get ready(): Promise<T> {
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
      this.reload();
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

  getSub<TSub = any>(name: string): TSub | typeof empty {
    const sub = this.subCache.get(name);
    if (!sub) {
      throw new Error(`Derived cache with name "${name}" does not exist.`);
    }

    if (sub.parent === this.cache) {
      if (sub.parent === empty) {
        throw new Error('Cache is empty and has not been initialized yet.');
      }
      return sub.cache as TSub;
    }

    // now sub.parent is not empty and not equal to this.cache, so we need to update it
    sub.parent = this.cache as T;
    return (sub.cache = sub.mapper(sub.parent));
  }
}
