import { DuoMap } from '@duo-map';
import { Cacher } from './cacher.js';

type MethodCacheDecorator = <This, R>(
  target: (this: This) => Promise<R>,
  context: ClassMethodDecoratorContext<This, (this: This) => Promise<R>>,
) => (this: This) => Promise<R>;

type Ctx<This, R> = ClassMethodDecoratorContext<This, (this: This) => Promise<R>>;

const cacherMap = new DuoMap<string | symbol, any, Cacher>();

/**
 * Load all decorated caches.
 * - Calls reload of the uninitialized caches.
 * - **Only** affects cachers that are decorated with `@Cache`.
 * @returns a promise that you can await to ensure all decorated caches have been initialized.
 */
export function initializeDecoratedCaches(force = false): Promise<any[]> {
  return Promise.all([...cacherMap.values()].map((c) => (c.initialized && !force ? true : c.reload())));
}

/**
 * Destroy the decorated cache for the given id and instance, to free up resources and remove it from the internal cache map.
 * @param id Registered id
 * @param instance Instance of the class.
 */
export function destroyDecoratedCache(id: string, instance: any): void {
  const c = cacherMap.get(id, instance);
  if (c) {
    cacherMap.delete(id, instance);
    c.destroy();
  }
}

/**
 * A class method decorator. Caches the result of a no-argument **async** method.
 * **You must handle errors in your method**.
 * The method must be `async`: the cached value is always accessed through a promise.
 * @param id The id for the cached method.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(options?: { id?: string; ttl?: number }): MethodCacheDecorator {
  return function <This, R>(target: (this: This) => Promise<R>, context: Ctx<This, R>) {
    if (context.kind !== 'method') {
      throw new Error('@Cache can only be applied to class methods.');
    }

    let { id = context.name, ttl } = Object(options);
    return function (this: This) {
      return cacherMap.getOrInsertComputed(id, this, () => new Cacher(target, ttl, this)).get();
    };
  };
}
