const empty = Symbol();
type empty = typeof empty;

/**
 * A thenable type. Usually a `Promise` object.
 */
type PromiseLike<T> = { then: (onfulfilled: (value: T) => any) => any };

function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return value && typeof value.then === 'function';
}

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

export class Cacher<T = any, Getter extends (() => PromiseLike<T>) | (() => T) = () => PromiseLike<T>> {
  /**
   * @internal
   */
  private readonly getter: Getter;
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
  private pending: PromiseLike<T> | empty = empty;

  /**
   * @internal
   */
  private sub = new Map<string, SubCacheEntry<T, any>>();

  /**
   * Create a cacher instance.
   * @param getter An async value getter. **Remember to handle errors in your getter**.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => PromiseLike<T>, ttl: number);

  /**
   * Create a cacher instance.
   * @param getter A sync value getter. **Remember to handle errors in your getter**.
   * @param ttl Time-to-live for the cached value in milliseconds.
   */
  constructor(getter: () => T, ttl: number);
  constructor(getter: Getter, ttl: number) {
    this.getter = getter;
    this.ttl = ttl;
  }

  /**
   * Always awaits the loading getter to be settled.
   */
  load(): ReturnType<Getter> {
    // # Not fetching immediately at the cache's expiration, only start the reloading process.

    if (this.pending !== empty) {
      // already pending
      return this.pending as ReturnType<Getter>;
    }

    try {
      const result = this.getter();
      if (isPromiseLike(result)) {
        this.pending = result;
        this.pending.then((v) => (this.cache = v)).finally(() => (this.pending = empty));
      } else {
        this.cache = result;
      }
      this.last = performance.now();
      return result as ReturnType<Getter>;
    } finally {
      this.pending = empty;
    }
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
const a = new Cacher(() => 3, 1000);
const b = a.load();

const a1 = new Cacher(async () => 3, 1000);
const b1 = a1.load();
