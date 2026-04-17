import type { Func, Class } from './global.js';
import { UntypedWhether } from './whether.js';

class _ extends UntypedWhether {
  orNegativeZero(o: any): boolean {
    return o === undefined || this.isNegativeZero(o);
  }

  orPositiveZero(o: any): boolean {
    return o === undefined || this.isPositiveZero(o);
  }

  orFunction(o: any): o is Func | undefined {
    return o === undefined || this.isFunction(o);
  }

  orObject<T extends object>(o: any): o is T | undefined {
    return o === undefined || this.isObject(o);
  }

  /**
   * Tell whether the target is a non-null object or a function
   * @param o
   */
  orLikeObject(o: unknown) {
    return o === undefined || this.likeObject(o);
  }

  /**
   * Tell whether the target is a string
   * @param o
   */
  orString(o: any): o is string | undefined {
    return o === undefined || this.isString(o);
  }

  /**
   * Tell whether the target is a number
   * @param o
   */
  orNumber(o: any): o is number | undefined {
    return o === undefined || this.isNumber(o);
  }

  /**
   * Tell whether the target is a boolean
   * @param o
   */
  orBoolean(o: any): o is boolean | undefined {
    return o === undefined || this.isBoolean(o);
  }

  /**
   * Tell whether the target is undefined
   * @param o
   */
  orUndefined(o: any): o is undefined {
    return o === undefined || this.isUndefined(o);
  }

  /**
   * Tell whether the target is null
   * @param o
   */
  orNull(o: any): o is null | undefined {
    return o === undefined || this.isNull(o);
  }

  /**
   * Tell whether the target is a symbol
   * @param o
   */
  orSymbol(o: any): o is symbol | undefined {
    return o === undefined || this.isSymbol(o);
  }

  /**
   * Tell whether the target is a bigint
   * @param o
   */
  orBigInt(o: any): o is bigint | undefined {
    return o === undefined || this.isBigInt(o);
  }

  orField(o: unknown): o is string | symbol | undefined {
    return o === undefined || this.isField(o);
  }

  orPropertyKey(o: unknown): o is string | symbol | number | undefined {
    return o === undefined || this.isPropertyKey(o);
  }

  orNaN(o: any): boolean | null {
    return o === undefined || this.isNaN(o);
  }

  orInteger(o: any): boolean {
    return o === undefined || this.isInteger(o);
  }

  orSafeInteger(o: any): boolean {
    return o === undefined || this.isSafeInteger(o);
  }

  orSafeNumber(o: any): boolean {
    return o === undefined || this.isSafeNumber(o);
  }

  orClass(o: any): o is Class | undefined {
    return o === undefined || this.isClass(o);
  }

  orArray<T = any>(
    o: any,
    predicate?: (value?: T, index?: number, array?: T[]) => string | boolean,
  ): o is T[] | undefined {
    return o === undefined || this.isArray(o, predicate);
  }
}
