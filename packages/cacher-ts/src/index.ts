interface Operation<T> {
  oper: 'get' | 'clear';
  resolve: (data: T) => void;
  reject: (value: any) => void;
}

const _prom = () => {
  let resolve!: (value: any) => void;
  let reject!: (value: any) => void;
  const promise = new Promise<any>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const _null = Symbol();
const _is = Object.is;
const _now = Date.now;

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = NaN;
  private cache: T | typeof _null = _null;

  private queue: Operation<T>[] = [];
  private executing: boolean = false;

  constructor(getter: () => Promise<T>, ttl: number = 86400_000) {
    this.getter = getter;
    this.ttl = ttl;
  }

  private async exec(o: Operation<T>) {
    this.queue.push(o);
    if (this.executing) {
      return;
    }

    this.executing = true;
    let item: Operation<T> | undefined;
    while ((item = this.queue.shift())) {
      if (item.oper === 'get') {
        if (isNaN(this.lastGetTime) || _now() - this.lastGetTime >= this.ttl || this.cache === _null) {
          try {
            this.cache = await this.getter();
            this.lastGetTime = _now(); // In case that getter takes too much time but ttl is small.
            item.resolve(this.cache);
          } catch (e) {
            item.reject(e);
          }
        } else {
          item.resolve(this.cache as T);
        }
      } else if (item.oper === 'clear') {
        this.cache = _null;
        this.lastGetTime = NaN;
        // @ts-expect-error does not need any value to resolve
        item.resolve();
      }
    }
    this.executing = false;
  }

  /**
   * Getter of the value.
   */
  async get(): Promise<T> {
    const { resolve, promise, reject } = _prom();
    this.exec({ oper: 'get', resolve, reject });
    return promise;
  }

  /**
   * Clears the cached value and marks the cacher as dirty.
   * @returns The current cacher instance.
   */
  clear(): Promise<void> {
    const { resolve, promise, reject } = _prom();
    this.exec({ oper: 'clear', resolve, reject });
    return promise;
  }

  /**
   * Derives a new cacher from the current one by applying a mapping function to its value.
   * @param mapFn The mapping function to apply to the current cacher's value.
   * @returns A new cacher that holds the mapped value.
   */
  derive<TSub = any>(mapFn: (value: T) => TSub): SubCacher<TSub> {
    return new SubCacher<TSub>(this, mapFn);
  }
}

export class SubCacher<TSub = any> {
  private parentCache: any = _null;
  private cache: TSub | typeof _null = _null;

  constructor(
    private readonly parent: Cacher,
    /**
     * Must be a pure sync function.
     * It will be called without await.
     */
    private readonly mapFn: (value: any) => TSub,
  ) {}

  async get(): Promise<TSub> {
    const result = await this.parent.get();
    if (_is(this.parentCache, result)) {
      return this.cache as TSub;
    }

    const v = this.mapFn(result) as any;
    if (typeof v?.then === 'function') {
      console.warn('mapFn is called without await, so this thenable result will be kept.');
    }
    this.cache = v;
    this.parentCache = result;
    return this.cache as TSub;
  }
}
