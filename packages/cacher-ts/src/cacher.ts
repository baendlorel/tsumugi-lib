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
  private getter: (lastValue?: T) => T | Promise<T>;
  /* @internal */
  private ttl: number;
  /* @internal */
  protected thisArg: any;

  /* @internal */
  private last: number = -Infinity;
  /* @internal */
  private cache: T | empty = empty;
  /* @internal */
  private pending: Promise<T> | empty = empty;
  /* @internal */
  private inited: boolean = false;
  /* @internal */
  private sub = new Map<keyof Subs, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter A value getter, sync or async. **Remember to handle errors in your getter**.
   *   A sync getter is awaited like any other, so both kinds are interchangeable at the call site.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: (lastValue?: T) => T | Promise<T>, ttl: number = Infinity, thisArg: any = null) {
    if (ttl !== Infinity) {
      if (typeof ttl !== 'number' || !Number.isSafeInteger(ttl) || ttl < 0 || ttl > 2147483647) {
        throw new TypeError(`ttl must be a positive integer less than 2147483647.`);
      }
    }
    if (typeof getter !== 'function') {
      throw new TypeError(`getter must be a function.`);
    }
    this.getter = getter;
    this.ttl = ttl;
    this.thisArg = thisArg;
  }

  /**
   * `true` once the getter has completed at least one successful load.
   */
  get initialized(): boolean {
    return this.inited;
  }

  /**
   * Rebinds `this` for the getter and the sub-cache mappers. Does not trigger a reload.
   */
  setThis(thisArg: any): this {
    this.thisArg = thisArg;
    return this;
  }

  /* @internal */
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
   * Returns the cached value, reloading and awaiting it first if the cache is empty or expired.
   */
  async get(): Promise<T> {
    if (!this.inited || performance.now() - this.last >= this.ttl) {
      return this.reload();
    }
    return this.cache as T;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * - the mapper is called with `cacher.thisArg`
   * - overwrite existing sub-cache if it already exists.
   *
   * @param pureMapper Ideally a **pure sync function**; an `async` one works at runtime
   *   (its result is awaited) but does not fit the declared type.
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
   * Only the **first** mapper registered for a name is kept; later ones are ignored.
   * @param name The name of the derived sub-cache.
   * @param pureMapFn The mapper to register if `name` is not derived yet.
   */
  getOrDerive<SubKey extends keyof Subs>(name: SubKey, pureMapFn: (value: T) => Subs[SubKey]): Promise<Subs[SubKey]> {
    if (!this.sub.has(name)) {
      this.derive(name, pureMapFn);
    }
    return this.getSub(name);
  }

  /**
   * Get the cached value derived by the mapper.
   * Awaits the parent cache first (reloading it when expired), then runs the mapper
   * only if the parent value changed by identity since the last mapping.
   */
  async getSub<SubKey extends keyof Subs>(key: SubKey): Promise<Subs[SubKey]> {
    const sub = this.sub.get(key);
    if (!sub) {
      throw new Error(`No derived cache with name "${String(key)}".`);
    }

    const current = await this.get();
    if (Object.is(sub.parent, current)) {
      return sub.cache as Subs[SubKey];
    }

    // ! Assign only after the mapper settles, so parent and cache stay consistent even if it throws.
    const cache = await sub.fn.call(this.thisArg, current);

    sub.parent = current;
    sub.cache = cache;

    return cache;
  }

  destroy(): void {
    this.getter = null as any;
    this.cache = null as any;
    this.sub.clear();
    this.sub = null as any;
    this.pending = null as any;
    this.thisArg = null as any;
    this.inited = false;
    this.last = 0;
  }
}
