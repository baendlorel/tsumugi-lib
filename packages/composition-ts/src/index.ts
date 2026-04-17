import type { Compose, Constructor, Mutable } from './global.js';
import { $define, $defines, $getOwnPropertyDescriptors } from '@shared';

function notNewable(value: unknown): value is new (...args: unknown[]) => unknown {
  if (typeof value !== 'function') {
    return true;
  }
  try {
    const Proxied = new Proxy(value as Constructor, {
      construct() {
        return {};
      },
    });
    new Proxied();
    return false;
  } catch {
    return true;
  }
}

/**
 * Instead of using class inheritance, we can compose prototypes from multiple objects. This function takes a constructor function and an array of objects, and returns a new class that creates instances with the combined prototype of all the objects.
 * - `initializer` **must not** be an arrow function!
 * - returned class's name is `initializer.name`
 *
 * @param initializer A function that initializes the instance. It will be called with the instance as `this` and use the arguments passed to the constructor.
 * @param parts An array of objects whose properties will be copied(via descriptors) to the prototype of the new class.
 *
 * __PKG_INFO__
 */
export function compose<
  Protos extends readonly object[],
  Args extends any[],
  Instance extends Compose<Protos> = Compose<Protos>,
>(initializer: (this: Mutable<Instance>, ...args: Args) => any, ...parts: Protos): new (...args: Args) => Instance {
  if (notNewable(initializer)) {
    throw new TypeError(
      `First argument must be a non-arrow function because it cannot access the instance's 'this' context.`,
    );
  }

  const NewClass = $define(
    class {
      constructor(...args: Args) {
        initializer.apply(this as any, args);
      }
    },
    'name',
    {
      value: initializer.name,
      configurable: true,
    },
  );

  for (let i = 0; i < parts.length; i++) {
    const descriptors = $getOwnPropertyDescriptors(parts[i]);
    $defines(NewClass.prototype, descriptors);
  }

  return NewClass as new (...params: Args) => Instance;
}
