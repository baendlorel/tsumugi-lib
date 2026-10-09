interface Operation<T> {
  oper: 'get' | 'clear';
  resolve: (data: { value: T; cached: boolean }) => void;
  reject: (value: any) => void;
}

function createPromise() {
  let resolve!: (value: any) => void;
  let reject!: (value: any) => void;
  const promise = new Promise<any>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const Empty = Symbol('Empty');

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private lastGetTime: number = NaN;
  private cache: T | typeof Empty = Empty;

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
        const now = Date.now();
        if (isNaN(this.lastGetTime) || now - this.lastGetTime > this.ttl || this.cache === Empty) {
          try {
            this.cache = await this.getter();
            this.lastGetTime = now;
            item.resolve({ value: this.cache, cached: false });
          } catch (e) {
            item.reject(e);
          }
        } else {
          item.resolve({ value: this.cache as T, cached: true });
        }
      } else if (item.oper === 'clear') {
        this.cache = Empty;
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
    const { resolve, promise, reject } = createPromise();
    this.exec({ oper: 'get', resolve, reject });
    const { value } = await promise;
    return value;
  }

  /**
   * Getter of the value.
   */
  async getDetail(): Promise<{ value: T; cached: boolean }> {
    const { resolve, promise, reject } = createPromise();
    this.exec({ oper: 'get', resolve, reject });
    return promise;
  }

  /**
   * Clears the cached value and marks the cacher as dirty.
   * @returns The current cacher instance.
   */
  clear(): Promise<void> {
    const { resolve, promise, reject } = createPromise();
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
  private cache: TSub | typeof Empty = Empty;

  constructor(
    private readonly parent: Cacher,
    private readonly mapFn: (value: any) => TSub,
  ) {}

  async get(): Promise<TSub> {
    const result = await this.parent.getDetail();
    if (!result.cached || this.cache === Empty) {
      this.cache = await this.mapFn(result.value);
    }
    return this.cache as TSub;
  }
}
