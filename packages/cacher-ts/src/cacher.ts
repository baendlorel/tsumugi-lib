import { empty } from './common.js';
import { promiseTry } from '@shared/std/promise.js';

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

export class Cacher<Subs extends Record<string, any> = Record<string, any>, T = any> {
  /* @internal */
  private readonly getter: (lastValue?: T) => T | Promise<T>;
  /* @internal */
  private readonly ttl: number;

  /* @internal */
  private thisArg: any = null;
  /* @internal */
  private last: number = -Infinity;
  /* @internal */
  private cache: T | empty = empty;
  /* @internal */
  private pending: Promise<T> | empty = empty;
  /* @internal */
  private inited: boolean = false;
  /* @internal */
  private readonly sub = new Map<keyof Subs, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter A value getter, sync or async. **Remember to handle errors in your getter**.
   *   A sync getter is awaited like any other, so both kinds are interchangeable at the call site.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: (lastValue?: T) => T | Promise<T>, ttl: number) {
    if (typeof ttl !== 'number' || !Number.isSafeInteger(ttl) || ttl < 0 || ttl > 2147483647) {
      throw new TypeError(`ttl must be a positive integer less than 2147483647.`);
    }
    if (typeof getter !== 'function') {
      throw new TypeError(`getter must be a function.`);
    }
    this.getter = getter;
    this.ttl = ttl;
  }

  /**
   * Checks if the cache is empty.
   */
  get initialized(): boolean {
    return this.inited;
  }

  /**
   * Initializes the cacher with the given `this` context.
   * If the cache is empty, it will trigger a reload.
   */
  setThis(thisArg: any): this {
    this.thisArg = thisArg;
    return this;
  }

  private async runGetter() {
    try {
      const data = await promiseTry(this.getter, this.thisArg, this.cache === empty ? undefined : this.cache);
      this.inited = true;
      this.last = performance.now();
      this.cache = data;
      return data;
    } finally {
      this.pending = empty;
    }
  }

  /**
   * Always awaits the loading getter to be settled.
   */
  async reload(): Promise<T> {
    if (this.pending !== empty) {
      return this.pending as Promise<T>;
    }

    this.pending = this.runGetter();
    await this.pending;
    return this.cache as T;
  }

  /**
   * Returns the current loading promise for the cached value, or `false` if no reload is in progress.
   */
  get loading(): Promise<T> | false {
    return this.pending === empty ? false : (this.pending as Promise<T>);
  }

  /**
   * Getter of the value.
   * If the cached value is outdated, it will trigger the initialization.
   */
  async get(): Promise<T> {
    if (!this.inited || performance.now() - this.last >= this.ttl) {
      return this.reload();
    }
    return this.cache as T;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * - pure sync mapper will be called with `cacher.thisArg`
   * - overwrite existing sub-cache if it already exists.
   *
   * @param pureMapper Must be a **pure sync function**. It will be called without `await`.
   */
  derive<SubKey extends keyof Subs>(name: SubKey, pureMapper: (value: T) => Subs[SubKey]): void {
    this.sub.set(name, { cache: empty, parent: empty, fn: pureMapper });
  }

  /**
   * Removes a derived sub-cache by its name.
   * @returns `true` if the sub-cache existed and was removed, `false` otherwise.
   */
  deleteSub(key: keyof Subs): boolean {
    return this.sub.delete(key);
  }

  /**
   * Checks if a derived sub-cache exists by its name.
   */
  hasSub(key: keyof Subs): boolean {
    return this.sub.has(key);
  }

  /**
   * Gets the derived sub-cache by its name, or derives it if it doesn't exist.
   * @param name The name of the derived sub-cache.
   * @param pureMapper Must be a **pure function**.
   */
  getOrDerive<SubKey extends keyof Subs>(name: SubKey, pureMapFn: (value: T) => Subs[SubKey]): Promise<Subs[SubKey]> {
    if (!this.sub.has(name)) {
      this.derive(name, pureMapFn);
    }
    return this.getSub(name);
  }

  /**
   * Get the cached value derived by the mapper.
   */
  async getSub<SubKey extends keyof Subs>(key: SubKey): Promise<Subs[SubKey]> {
    const sub = this.sub.get(key);
    if (!sub) {
      throw new Error(`No derived cache with name "${String(key)}".`);
    }

    // Initialized cache won't be empty.
    const current = await this.get();
    if (Object.is(sub.parent, current) && current !== empty) {
      return sub.cache as Subs[SubKey];
    }

    const parent = current;
    const cache = await sub.fn.call(this.thisArg, parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}

// const a = new Cacher(() => 3, 1000);
// const b = a.reload();

// const a1 = new Cacher(async () => 3, 1000);
// const b1 = a1.reload();
