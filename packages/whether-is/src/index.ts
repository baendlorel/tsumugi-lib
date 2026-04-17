import { UntypedWhether } from './whether.js';

type Whether = (<T = any>(o: unknown) => o is T) & UntypedWhether;

/**
 * ## Usage
 * Find out whether the given target is truthy.
 * - various sub method available, such as `whether.isTruthy`, `whether.isNaN`, `whether.isEmpty`, etc.
 * @param target The target to check
 * @returns boolean
 *
 * __PKG_INFO__
 */
export const whether: Whether = new UntypedWhether() as Whether;
