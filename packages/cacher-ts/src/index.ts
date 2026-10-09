// TODO 改用队列模式
export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private pendingPromise: Promise<T> | null = null;
  private lastGetTime: number = NaN;
  private cache: T | null = null;

  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  /**
   * Getter of the value.
   */
  async get(): Promise<T> {
    const now = Date.now();
    if (this.dirty || now - this.lastGetTime > this.ttl) {
      if (!this.pendingPromise) {
        this.pendingPromise = this.getter();
      }

      this.cache = await this.pendingPromise;

      this.lastGetTime = now;
      this.pendingPromise = null;
    }

    return this.cache!;
  }

  /**
   * Indicates whether the cacher is dirty (i.e., has never been populated).
   * @returns `true` if the cacher is dirty, otherwise `false`.
   */
  get dirty() {
    return Number.isNaN(this.lastGetTime);
  }

  /**
   * Clears the cached value and marks the cacher as dirty.
   * @returns The current cacher instance.
   */
  clear(): this {
    this.pendingPromise = null;
    this.cache = null;
    this.lastGetTime = NaN;
    return this;
  }

  /**
   * Derives a new cacher from the current one by applying a mapping function to its value.
   * @param mapFn The mapping function to apply to the current cacher's value.
   * @returns A new cacher that holds the mapped value.
   */
  derive<TSub = any>(mapFn: (value: T) => TSub): Cacher<TSub> {
    return new Cacher(async () => {
      const value = await this.get();
      return mapFn(value);
      // Infinity means it will follow the parent cacher's updates.
    }, Infinity);
  }
}
