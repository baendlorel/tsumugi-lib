import { promiseTry } from '@shared/std/promise.js';
import { empty, infinityBigInt, validTTL } from './common.js';

interface SubCacheEntry<T, TSub = any> {
  /**
   * Current cache
   */
  cache: TSub | empty;

  /**
   * Version of the parent cache the current `cache` was mapped from.
   * `-1` means "never mapped".
   */
  version: number;

  /**
   * Mapping function. Must be pure.
   */
  fn: (value: T) => TSub;
}

function now(): bigint {
  return BigInt(Math.floor(performance.now()));
}

export class Cacher<Subs extends Record<string, any> = Record<string, any>, T = any> {
  /* @internal */
  private getter: (lastValue?: T) => T | Promise<T>;
  /* @internal */
  private ttl: bigint;
  /* @internal */
  protected thisArg: any;

  /* @internal */
  private last: bigint = -1n;
  /**
   * Bumped every time `cache` is replaced. Starts at `0`; sub-caches compare
   * against it to decide whether their mapping is still valid.
   */
  /* @internal */
  private version: number = 0;
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
  constructor(getter: (lastValue?: T) => T | Promise<T>, ttl: number | bigint = Infinity, thisArg: any = null) {
    if (typeof getter !== 'function') {
      throw new TypeError(`getter must be a function.`);
    }
    this.getter = getter;
    this.ttl = validTTL(ttl);
    this.thisArg = thisArg;
  }

  /**
   * Modify the cache data by a sync function.
   *
   * Watch out for **race conditions** when used simultaneously with `reload`.
   * @param mapper a synchronous function that modifies the cached value.
   * @param ignorePending **Racing condition warning:** If `true`, forces the patch even if there is a pending reload.
   */
  patch(mapper: (value: T) => T, ignorePending = false): boolean {
    if (ignorePending || this.pending === empty) {
      this.cache = mapper(this.cache as T);
      this.version++;
      return true;
    }
    return false;
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
      this.last = now();
      this.cache = data;
      this.version++;
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
    if (!this.inited) {
      return this.reload();
    }
    // Never expires
    if (this.ttl === infinityBigInt) {
      return this.cache as T;
    }
    if (now() - this.last >= this.ttl) {
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
    this.sub.set(name, { cache: empty, version: -1, fn: pureMapper });
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
   * only if the parent value was replaced since the last mapping.
   */
  async getSub<SubKey extends keyof Subs>(key: SubKey): Promise<Subs[SubKey]> {
    const sub = this.sub.get(key);
    if (!sub) {
      throw new Error(`No derived cache with name "${String(key)}".`);
    }

    const current = await this.get();
    // Captured before the mapper runs, so a parent update mid-mapping leaves the sub-cache stale-and-remappable
    // rather than wrongly marked fresh.
    const version = this.version;
    if (sub.version === version) {
      return sub.cache as Subs[SubKey];
    }

    // ! Assign only after the mapper settles, so version and cache stay consistent even if it throws.
    const cache = await sub.fn.call(this.thisArg, current);

    sub.version = version;
    sub.cache = cache;

    return cache;
  }

  /**
   * Returns if the cacher has been destroyed.
   */
  get destroyed(): boolean {
    return this.getter === null;
  }

  /**
   * When destroyed, clears all cached values and sub-caches, and resets the internal state.
   * - Methods will be unusable after destruction.
   */
  destroy(): void {
    this.getter = null as any;
    this.cache = null as any;
    this.sub.clear();
    this.sub = null as any;
    this.pending = null as any;
    this.thisArg = null as any;
    this.last = -1n;
    this.version = 0;
  }
}
