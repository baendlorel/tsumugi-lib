import type { ReachResult, GroupedKey } from './deep.js';

/**
 * This is the `ReflectDeep` namespace without runtime strict type checks.
 *
 * __PKG_INFO__
 */
export namespace ReflectDeep {
  /**
   * Checks if a nested property exists at the given path.
   * @param target - Target object to check.
   * @param propertyKeys - Property path to check.
   * @returns `true` if the property exists, `false` otherwise.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.has(obj, ['a', 'b', 'c']); // true
   */
  export function has(target: object, propertyKeys: PropertyKey[]): boolean {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i < lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return false;
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return false;
      }
    }
    return Reflect.has(current, propertyKeys[lastIndex]);
  }

  /**
   * Gets the value of a nested property.
   * @param target - Target object.
   * @param propertyKeys - Property path.
   * @param receiver - The `this` value for getter calls.
   * @returns The property value, or `undefined` if not found.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
   */
  export function get<T = any>(target: any, propertyKeys: PropertyKey[], receiver?: any): T | undefined {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i < lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return undefined;
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return undefined;
      }
    }

    const result =
      receiver === undefined
        ? Reflect.get(current, propertyKeys[lastIndex])
        : Reflect.get(current, propertyKeys[lastIndex], receiver);

    return result as T | undefined;
  }

  /**
   * Sets a nested property value, creating intermediate objects as needed.
   * @param target - Target object.
   * @param propertyKeys - Property path.
   * @param value - Value to set.
   * @param receiver - The `this` value for setter calls.
   * @returns `true` if successful, `false` otherwise.
   * @example
   * const obj = { };
   * ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello'); // Creates nested structure
   * obj.a.b.c; // 'hello'
   */
  export function set<T = any>(target: any, propertyKeys: PropertyKey[], value: T, receiver?: any): boolean {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i < lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        if (!Reflect.set(current, propertyKeys[i], {})) {
          return false;
        }
      }

      // Check if current can be set
      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return false;
      }
    }

    return receiver === undefined
      ? Reflect.set(current, propertyKeys[lastIndex], value)
      : Reflect.set(current, propertyKeys[lastIndex], value, receiver);
  }

  /**
   * Traverses a property path and returns the furthest reachable value with its index.
   * @param target - Target object to traverse.
   * @param propertyKeys - Property path to traverse.
   * @param receiver - The `this` value for getter calls.
   * @returns Object with `value` (furthest reachable value), `index` (position reached), and `reached` (whether the full path was traversed).
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.reach(obj, ['a', 'b', 'c']); // { value: 'hello', index: 2, reached: true }
   * ReflectDeep.reach(obj, ['a', 'b', 'd']); // { value: { c: 'hello' }, index: 1, reached: false }
   * ReflectDeep.reach(obj, ['a', 'x']);     // { value: { b: { c: 'hello' } }, index: 0, reached: false }
   * ReflectDeep.reach(obj, ['d', 'x']);     // { value: { a: { b: { c: 'hello' } } }, index: -1, reached: false }
   */
  export function reach(target: object, propertyKeys: PropertyKey[], receiver?: any): ReachResult {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i <= lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return { value: current, index: i - 1, reached: false };
      }

      if (i === lastIndex) {
        const value =
          receiver === undefined
            ? Reflect.get(current, propertyKeys[i])
            : Reflect.get(current, propertyKeys[i], receiver);

        return { value, index: i, reached: true };
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return { value: current, index: i, reached: false };
      }
    }

    // Should not reach here, but just in case
    return { value: current, index: -1, reached: false };
  }

  /**
   * Deletes a nested property at the given path.
   *
   * **Has same behavior as the original `Reflect.deleteProperty`**
   * - property does not exist, return `true`
   * - exists and configurable, return `true`
   * - exists but not configurable, return `false`
   * - `target` is frozen, return `false`
   * @param target Target object.
   * @param propertyKeys Property path to delete.
   * @returns `true` if successful, `false` otherwise.
   * @example
   * const obj = { a: { b: { c: 'hello', d: 'world' } } };
   * ReflectDeep.deleteProperty(obj, ['a', 'b', 'c']); // true
   * obj.a.b; // { d: 'world' }
   */
  export function deleteProperty(target: object, propertyKeys: PropertyKey[]): boolean {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i < lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return true;
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return false;
      }
    }

    return Reflect.deleteProperty(current, propertyKeys[lastIndex]);
  }

  /**
   * Defines a nested property with the given descriptor, creating intermediate objects as needed.
   *
   * **Has same behavior as the original `Reflect.defineProperty`**
   * @param target Target object.
   * @param propertyKeys Property path to define.
   * @param descriptor Property descriptor to apply.
   * @returns `true` if successful, `false` otherwise.
   * @example
   * const obj = {};
   * ReflectDeep.defineProperty(obj, ['a', 'b', 'c'], { value: 'hello', writable: true });
   * obj.a.b.c; // 'hello'
   *
   * // Define getter/setter
   * ReflectDeep.defineProperty(obj, ['x', 'y'], {
   *   get() { return this._value; },
   *   set(v) { this._value = v; }
   * });
   */
  export function defineProperty(target: object, propertyKeys: PropertyKey[], descriptor: PropertyDescriptor): boolean {
    const lastIndex = propertyKeys.length - 1;

    let current = target;
    for (let i = 0; i < lastIndex; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        if (!Reflect.set(current, propertyKeys[i], {})) {
          return false;
        }
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (current === undefined || current === null) {
        return false;
      }
    }

    return Reflect.defineProperty(current, propertyKeys[lastIndex], descriptor);
  }

  /**
   * Gets all property keys (including symbols) from the target object and its prototype chain.
   * Returns a flattened array of unique keys from all prototype layers.
   * @param target - Target object to extract keys from.
   * @returns Array of all unique property keys from the object and its prototype chain.
   * @example
   * const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
   * const keys = ReflectDeep.keys(obj);
   * // Returns: ['own', Symbol(sym), 'toString', 'valueOf', ...] (includes prototype keys)
   *
   * // Works with custom prototypes
   * function Parent() {}
   * Parent.prototype.parentProp = 'parent';
   * const child = Object.create(Parent.prototype);
   * child.childProp = 'child';
   * ReflectDeep.keys(child); // ['childProp', 'parentProp', 'toString', ...]
   */
  export function ownKeys<T extends object>(target: T): (string | symbol)[] {
    const keySet = new Set(Reflect.ownKeys(target));
    let proto: object | null = target;
    while (true) {
      proto = Reflect.getPrototypeOf(proto);

      // * Proto chain will not contain any loop
      if (proto) {
        const keys = Reflect.ownKeys(proto);
        for (let i = 0; i < keys.length; i++) {
          keySet.add(keys[i]);
        }
      } else {
        return Array.from(keySet);
      }
    }
  }

  /**
   * Gets property keys grouped by prototype layer, preserving the prototype chain structure.
   * Returns an array where each element represents a layer in the prototype chain with its keys and object reference.
   * @param target - Target object to extract grouped keys from.
   * @returns Array of objects, each containing `keys` and `object` for each prototype layer.
   * @throws If target is not an object.
   * @throws If target is not an object.
   * @example
   * const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
   * const grouped = ReflectDeep.groupedKeys(obj);
   * // Returns: [
   * //   { keys: ['own', Symbol(sym)], object: obj },
   * //   { keys: ['toString', 'valueOf', ...], object: Object.prototype },
   * //   { keys: [], object: null }
   * // ]
   *
   * // Useful for inspecting prototype chain structure
   * function Parent() {}
   * Parent.prototype.parentProp = 'parent';
   * const child = Object.create(Parent.prototype);
   * child.childProp = 'child';
   * const layers = ReflectDeep.groupedKeys(child);
   * // layers[0] = { keys: ['childProp'], object: child }
   * // layers[1] = { keys: ['parentProp'], object: Parent.prototype }
   * // layers[2] = { keys: ['toString', ...], object: Object.prototype }
   */
  export function groupedKeys<T extends object>(target: T): GroupedKey[] {
    const keys: GroupedKey[] = [{ keys: Reflect.ownKeys(target), object: target }];
    let proto = Reflect.getPrototypeOf(target);
    while (true) {
      // * Proto chain will not contain any loop
      if (!proto) {
        return keys;
      }
      keys.push({
        object: proto,
        keys: Reflect.ownKeys(proto),
      });
      proto = Reflect.getPrototypeOf(proto);
    }
  }
}
