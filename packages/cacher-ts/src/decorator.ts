import { DuoMap } from '@duo-map';
import { Cacher } from './cacher.js';
import { validTTL } from './common.js';

class DecCacher extends Cacher {
  private id: string;
  constructor(getter: any, ttl: number | bigint, thisArg: any, id: string) {
    super(getter, ttl === -1n ? Infinity : ttl, thisArg);
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
   * Initializes every registered cache, resolving with their values in registry order.
   * Already-initialized caches keep their value unless `force` is `true`.
   */
  export function initializeAll(force = false): Promise<any[]> {
    return Promise.all([...cacherMap.values()].map((c) => (c.initialized && !force ? c.get() : c.reload())));
  }

  export async function initialize(instance: any, id: string): Promise<any> {
    const c = cacherMap.get(id, instance);
    if (!c) {
      throw new Error(`Cache with id "${id}" not found for the given instance.`);
    }
    return c.initialized ? c.get() : c.reload();
  }

  export function destroy(instance: any, id: string): void {
    const c = cacherMap.get(id, instance);
    if (c) {
      cacherMap.delete(id, instance);
      c.destroy();
    }
  }

  export function get(instance: any, id: string): Cacher | undefined {
    return cacherMap.get(id, instance);
  }
}

interface CacheOptions {
  /**
   * Identifier for the cache. Defaults to the method name if not provided.
   */
  id?: string;

  /**
   * Time-to-live for the cached value in milliseconds.
   * - `number` or `bigint`; a `number` must be a non-negative safe integer, a `bigint` non-negative.
   * - Can be `Infinity` for a cache that never expires.
   * - Use `bigint` for TTLs beyond `2**53` ms.
   */
  ttl?: number | bigint;
}

/**
 * A class method decorator. Caches the result of a no-argument **async** method.
 * **You must handle errors in your method**.
 * The method must be `async`: the cached value is always accessed through a promise.
 * The cacher is created on the first call, keyed by `[id, instance]`.
 *
 * @param options.id Identifier for the cache. Defaults to the method name if not provided.
 * @param options.ttl Time-to-live for the cached value in milliseconds. `number` or `bigint`, both non-negative. Can be `Infinity` for a cache that never expires.
 */
export function Cache(options?: CacheOptions): MethodCacheDecorator {
  let { id, ttl } = Object(options);
  ttl = validTTL(ttl);

  return function <This, R>(target: (this: This) => Promise<R>, context: Ctx<This, R>) {
    if (context.kind !== 'method') {
      throw new Error('@Cache can only be applied to class methods.');
    }
    id = id ?? context.name;
    return function (this: This) {
      return cacherMap.getOrInsertComputed(id, this, () => new DecCacher(target, ttl, this, id)).get();
    };
  };
}
