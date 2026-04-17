type Fn = (...args: unknown[]) => unknown;

/**
 * Result object for V8 function feature analysis
 *
 * - isConstructor: Determines if argument is a function object with a [[Construct]] internal method
 * - isCallable: Determines if argument is a callable function with a `[[Call]]` internal method
 * - isAsyncFunction: `true` if the function is an async function
 * - isGeneratorFunction: `true` if the function is a generator function
 * - isProxy: `true` if the function is a Proxy
 * - isBound: `true` if the function has a bound target (created by Function.prototype.bind)
 * - isClass: `true` if the function is a class (either user-defined or native)
 * - origin: The original function/object (unwrapped)
 */
interface FunctionFeaturesResult {
  /**
   * Determines if argument is a function object with a `[[Construct]]` internal method
   * @see ECMA-262_15th_edition_june_2024 7.2.4 IsConstructor
   */
  isConstructor: boolean;

  /**
   * Determines if argument is a callable function with a `[[Call]]` internal method
   * @see ECMA-262_15th_edition_june_2024 7.2.3 IsCallable
   */
  isCallable: boolean;

  /**
   * `true` if the function is an async function
   */
  isAsyncFunction: boolean;

  /**
   * `true` if the function is a generator function
   */
  isGeneratorFunction: boolean;

  /**
   * `true` if the function is a Proxy
   */
  isProxy: boolean;

  /**
   * `true` if the function has a bound target (created by Function.prototype.bind)
   */
  isBound: boolean;

  /**
   * `true` if the function is a class (either user-defined or native constructor)
   * @see isClass in this module
   */
  isClass: boolean;

  /**
   * The original function/object (unwrapped)
   * @see getOrigin in this module
   */
  origin: Fn;
}

/**
 * Analyze a JavaScript function using V8 internals and return its feature flags
 *
 * @param fn The function to analyze
 * @returns An object containing isConstructor, isAsyncFunction, isGeneratorFunction, isProxy, isCallable, isBound
 * @throws if `o` is not a function
 */
export declare function getFeatures(fn: Fn): FunctionFeaturesResult;

/**
 * Get the function `fn0` satisfies `fn = fn0.bind(thisArg, ...args)`
 * @param fn The function to analyze
 * @throws if `o` is not a function
 */
export declare function getBound<T extends Fn>(fn: T): T | undefined;

/**
 * Get the true origin function/object, tracing through bound and proxy wrappers
 * - since there is no `[[BoundTargetFunction]]` in `object`, this method will only unwrap proxy of them
 * @param o The function/object to trace
 * @returns The original function/object (unwrapped)
 * @throws if `o` is not a function/object
 */
export declare function getOrigin<T extends unknown>(o: T): T;

/**
 * Get proxy details (target and handler) if the input is a Proxy object/function
 * @param o The object or function to inspect
 * @returns An object with `target` and `handler` fields if Proxy, otherwise undefined
 * @throws if `o` is not a function/object
 */
export declare function getProxyConfig(
  o: object | Fn
): { target: unknown; handler: unknown } | undefined;

/**
 * Set the name of a function
 * - Use v8-function.h: void SetName(Local<String> name)
 * - cannot set name when `configurable` is `false`
 *   - even [[SetFunctionName]] in es262 cannot do it (；´д｀)ゞ
 * @param fn The function to rename
 * @param name The new name, share the same rules as `[[SetFunctionName]]`
 * - if `name` is a symbol, this method will take `name.description` as the name
 *   - if `name.description` is undefined, use `''`
 *   - if `name.description` is a string, use `'[name.description]'`
 * @returns The function itself
 * @throws if `fn` is not a function or `name` is not a string/symbol
 */
export declare function setName<T extends Fn>(fn: T, name: string | symbol): T;

/**
 * Equivalent to `Function.prototype.toString` but uses V8 internals to get the string representation
 * - safe and will not be affected by the `toString` override
 * @param fn The function to convert to a string
 * @throws if `fn` is not a function
 */
export declare function protoToString(fn: Fn): string;

/**
 * Check if a function is a class (either user-defined or native constructor)
 * - since there is no `isClass` in V8, we implement our own
 *
 * **rules:**
 * 1. Must be a constructor
 * 2. Gets the original function (unwraps bound functions)
 * 3. Native constructor (Array, Object, etc.) will return `true`
 * 4. Checks function.toString() for class syntax patterns
 * @param fn The function to check
 * @returns true if the function is a class, false otherwise
 * @throws if `fn` is not a function
 */
export declare function isClass(fn: Fn): boolean;
