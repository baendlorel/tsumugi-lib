import { funcMacro } from './func.js';

export default funcMacro;

declare global {
  /**
   * ## Usage
   * use `__func__` in your code, rollup will turn it into the function name.
   * - by setting options.stringReplace to true, it can also replace `__func__` in string literals.
   *
   * __PKG_INFO__
   */
  const __func__: string;

  /**
   * ## Usage
   * use `__file__` in your code, rollup will turn it into the current file name.
   * - by setting options.stringReplace to true, it can also replace `__file__` in string literals.
   *
   * __PKG_INFO__
   */
  const __file__: string;
}
