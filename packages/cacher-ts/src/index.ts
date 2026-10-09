interface Operation<T> {
  operation: 'get' | 'clear';
  resolve: (value: T) => void;
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

export class Cacher<T = any> {
  private readonly getter: () => Promise<T>;
  private readonly ttl: number;

  private readonly children = new Set<Cacher<any>>();
  private parent: Cacher<any> | null = null;

  private lastGetTime: number = NaN;
  private cache: T | null = null;

  private queue: Operation<T>[] = [];
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
        const now = Date.now();
        if (isNaN(this.lastGetTime) || now - this.lastGetTime > this.ttl) {
          try {
            this.cache = await this.getter();
            this.lastGetTime = now;
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
        this.children.forEach((child) => child.clear());
      }
    }
    this.executing = false;
  }

  /**
   * Getter of the value.
   */
  async get(): Promise<T> {
    const { resolve, promise, reject } = createPromise();
    this.queue.push({ operation: 'get', resolve, reject });
    this.exec();
    return promise;
  }

  /**
   * Clears the cached value and marks the cacher as dirty.
   * @returns The current cacher instance.
   */
  clear(): Promise<void> {
    const { resolve, promise, reject } = createPromise();
    this.queue.push({ operation: 'clear', resolve, reject });
    this.exec();
    return promise;
  }

  /**
   * Derives a new cacher from the current one by applying a mapping function to its value.
   * @param mapFn The mapping function to apply to the current cacher's value.
   * @returns A new cacher that holds the mapped value.
   */
  derive<TSub = any>(mapFn: (value: T) => TSub): Cacher<TSub> {
    const child = new Cacher(() => this.get().then(mapFn), this.ttl);
    this.children.add(child);

    child.parent = this;
    child.lastGetTime = this.lastGetTime;

    return child;
  }

  destroy(): void {
    this.children.forEach((child) => child.destroy());
    if (this.parent) {
      this.parent.children.delete(this);
    }

    const queue = this.queue.splice(0);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.operation === 'get') {
        item.reject(new Error('[Cacher] Destroyed'));
      } else if (item.operation === 'clear') {
        item.resolve(null as any);
      }
    }

    this.cache = null;
    this.lastGetTime = NaN;
  }
}
