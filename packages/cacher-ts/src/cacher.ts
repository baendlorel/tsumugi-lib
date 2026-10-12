const empty = Symbol();
type empty = typeof empty;

/**
 * A thenable type. Usually a `Promise` object.
 */
type PromiseLike<T> = { then: (onfulfilled: (value: T) => any) => any };

function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return value && typeof value.then === 'function';
}

/**
 * Any getter a `Cacher` accepts: one that returns the value directly, or one
 * that returns a thenable for it.
 */
type GetterLike<T> = ((lastValue?: T) => T) | ((lastValue?: T) => PromiseLike<T>);

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

export class Cacher<
  Subs extends Record<string, any> = Record<string, any>,
  Getter extends GetterLike<any> = () => PromiseLike<any>,
  T = Awaited<ReturnType<Getter>>,
> {
  /**
   * @internal
   */
  private readonly getter: Getter;
  /**
   * @internal
   */
  private readonly ttl: number;

  private thisArg: any;

  /**
   * Last load time, or `-Infinity` before the first one.
   *
   * `performance.now()` can legitimately return `0` (it starts at 0 on a fresh
   * clock), so `0` cannot be used as an "unset" sentinel.
   * @internal
   */
  private last: number = -Infinity;
  /**
   * @internal
   */
  private cache: T | empty = empty;
  /**
   * @internal
   */
  private pending: PromiseLike<T> | empty = empty;

  /**
   * @internal
   */
  private sub = new Map<keyof Subs, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter A value getter, sync or async (`load()` mirrors it: it returns a promise for an async getter and the value itself for a sync one). **Remember to handle errors in your getter**.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: Getter, ttl: number) {
    this.getter = getter;
    this.ttl = ttl;
    this.thisArg = null;
  }

  /**
   * Checks if the cache is empty.
   * - We uses an internal empty symbol to represent an uninitialized cache.
   */
  get isEmpty(): boolean {
    return this.cache === empty;
  }

  /**
   * Initializes the cacher with the given `this` context.
   * If the cache is empty, it will trigger a reload.
   */
  setThis(thisArg: any) {
    this.thisArg = thisArg;
  }

  /**
   * Always awaits the loading getter to be settled.
   */
  reload(thisArg?: any): ReturnType<Getter> {
    // # Not fetching immediately at the cache's expiration, only start the reloading process.

    if (this.pending !== empty) {
      // already pending
      return this.pending as ReturnType<Getter>;
    }

    const result = this.getter.call(thisArg ?? this.thisArg, this.cache === empty ? undefined : this.cache);
    if (isPromiseLike<T>(result)) {
      this.pending = result;
      Promise.resolve(result).then(
        (v) => {
          this.cache = v;
          this.pending = empty;
        },
        () => (this.pending = empty),
      );
    } else {
      this.cache = result;
    }
    this.last = performance.now();
    return result as ReturnType<Getter>;
  }

  /**
   * Returns the current loading promise for the cached value, or `false` if no reload is in progress.
   */
  get loading(): PromiseLike<T> | false {
    return this.pending === empty ? false : (this.pending as PromiseLike<T>);
  }

  /**
   * Getter of the value.
   * If the cached value is outdated, it will trigger the initialization.
   */
  get(): T {
    if (this.cache === empty) {
      throw new Error('Cache is empty and has not been initialized yet.');
    }

    if (performance.now() - this.last >= this.ttl) {
      this.reload();
    }
    return this.cache as T;
  }

  /**
   * Derives a sub-cacher from the current one by applying a mapping function to its value.
   * @param pureMapper Must be a pure sync function. It will be called without `await`.
   */
  derive<SubKey extends keyof Subs>(name: SubKey, pureMapper: (value: T) => Subs[SubKey]): void {
    this.sub.set(name, { cache: empty, parent: empty, fn: pureMapper });
  }

  /**
   * Removes a derived sub-cache by its name.
   * @param name The name of the derived sub-cache to remove.
   * @returns `true` if the sub-cache existed and was removed, `false` otherwise.
   */
  removeSub(name: keyof Subs): boolean {
    return this.sub.delete(name);
  }

  getSub<SubKey extends keyof Subs>(name: SubKey): Subs[SubKey] {
    const sub = this.sub.get(name);
    if (!sub) {
      throw new Error(`No derived cache with name "${String(name)}".`);
    }

    if (Object.is(sub.parent, this.cache)) {
      if (sub.parent === empty) {
        throw new Error('Cache is not initialized yet.');
      }
      return sub.cache as Subs[SubKey];
    }

    const parent = this.cache as T;
    const cache = sub.fn(parent); // ! This makes parent and cache consistent even the mapper throws

    sub.parent = parent;
    sub.cache = cache;

    return cache;
  }
}

const a = new Cacher(() => 3, 1000);
const b = a.reload();

const a1 = new Cacher(async () => 3, 1000);
const b1 = a1.reload();
