interface Operation<T> {
  operation: 'get' | 'clear';
  timestamp: number;
  resolve: (value: T) => void;
  reject: (value: any) => void;
}

function createPromise() {
  let resolve: (value: any) => void;
  let reject: (value: any) => void;
  const promise = new Promise<any>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

const noop = () => {};

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private queue: Operation<T>[] = [];

  private lastGetTime: number = NaN;
  private cache: T | null = null;

  private executing: boolean = false;

  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  private async exec() {
    if (this.executing) {
      return;
    }

    this.executing = true;
    let item: Operation<T> | undefined;
    while ((item = this.queue.shift())) {
      if (item.operation === 'get') {
        if (this.dirty || item.timestamp - this.lastGetTime > this.ttl) {
          try {
            this.cache = await this.getter();
            this.lastGetTime = item.timestamp;
            item.resolve(this.cache);
          } catch (e) {
            item.reject(e);
          }
        } else {
          item.resolve(this.cache!);
        }
      } else if (item.operation === 'clear') {
        this.cache = null;
        this.lastGetTime = NaN;
        item.resolve(null as any);
      }
    }
    this.executing = false;
  }

  /**
   * Getter of the value.
   */
  async get(): Promise<T> {
    const now = Date.now();

    const { resolve, promise, reject } = createPromise();
    this.queue.push({ operation: 'get', timestamp: now, resolve, reject });
    this.exec();
    return promise;
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
    this.queue.push({ operation: 'clear', timestamp: Date.now(), resolve: noop, reject: noop });
    this.exec();
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
