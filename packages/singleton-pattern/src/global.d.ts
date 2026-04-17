export type Class = new (...args: any[]) => any;
export type ProxiedClass = new (...args: any[]) => any;

export interface SingletonifyOptions {
  /**
   * Preventing the `.prototype.constructor` from being accessed
   *
   * Default is `true`
   * - use Boolean Evaluation
   * - it is **not recommended** to set this to `false`
   *   - if it is falsy, will remain the original constructor unchanged
   * - will change `Origin.prototype.constructor` to the singletonified class
   *   - this means Origin.prototype.constructor !== origin
   */
  changeProtoConstructor?: boolean;

  /**
   * Default is `true`
   * - use Boolean Evaluation
   * - it is **not recommended** to set this to `false`
   *   - if it is falsy, it will create a new singletonified class every time and will not cache it
   * - by default, wrap a class multiple times will always return the same singletonified class
   */
  onlyOnce?: boolean;
}
