import { DuoMap } from '@duo-map';
import { Cacher } from './cacher.js';

class DecCacher extends Cacher {
  private id: string;
  constructor(getter: any, ttl: number, thisArg: any, id: string) {
    super(getter, ttl, thisArg);
    this.id = id;
  }

  destroy() {
    super.destroy();
    cacherMap.delete(this.id, this.thisArg);
  }
}

/**
 * Type of a method decorated with `@Cache`.
 * The decorated method **must be `async`** (i.e. it must return a `Promise`); a sync method
 * would be typed as `Promise<R>` at the call site while actually returning a plain value.
 */
type MethodCacheDecorator = <This, R>(
  target: (this: This) => Promise<R>,
  context: ClassMethodDecoratorContext<This, (this: This) => Promise<R>>,
) => (this: This) => Promise<R>;

type Ctx<This, R> = ClassMethodDecoratorContext<This, (this: This) => Promise<R>>;

/**
 * Keyed by `[id, instance]`: each instance caches independently, and unrelated classes
 * may reuse an id. Entries are added lazily, on the first call of the decorated method.
 */
const cacherMap = new DuoMap<string | symbol, any, DecCacher>();

export namespace DecoratedCache {
  /**
   * Initializes all cached instances.
   */
  export function initializeAll(force = false): Promise<any[]> {
    return Promise.all([...cacherMap.values()].map((c) => (c.initialized && !force ? true : c.reload())));
  }

  export function initialize(id: string, instance: any): Promise<any[]> {
    const c = cacherMap.get(id, instance);
    if (!c) {
      throw new Error(`Cache with id "${id}" not found for the given instance.`);
    }
    return c.initialized ? c.get() : c.reload();
  }

  export function destroy(id: string, instance: any): void {
    const c = cacherMap.get(id, instance);
    if (c) {
      cacherMap.delete(id, instance);
      c.destroy();
    }
  }

  export function get(id: string, instance: any): Cacher | undefined {
    return cacherMap.get(id, instance);
  }
}

/**
 * A class method decorator. Caches the result of a no-argument **async** method.
 * **You must handle errors in your method**.
 * The method must be `async`: the cached value is always accessed through a promise.
 * The cacher is created on the first call, keyed by `[id, instance]`.
 *
 * @param options Optional. `id` defaults to the method name, `ttl` to `Infinity`.
 * @param options.id Identifies this cache on the instance.
 * @param options.ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(options?: { id?: string; ttl?: number }): MethodCacheDecorator {
  return function <This, R>(target: (this: This) => Promise<R>, context: Ctx<This, R>) {
    if (context.kind !== 'method') {
      throw new Error('@Cache can only be applied to class methods.');
    }

    let { id = context.name, ttl } = Object(options);
    return function (this: This) {
      return cacherMap.getOrInsertComputed(id, this, () => new DecCacher(target, ttl, this, id)).get();
    };
  };
}
