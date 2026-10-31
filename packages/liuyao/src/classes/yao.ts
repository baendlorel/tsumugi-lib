import { 八卦表 } from '../core/common.js';

const _names = ['老阴', '少阳', '少阴', '老阳'] as const;
const _change = [1, 1, 2, 2] as const;

/**
 * 描述卦和爻的动静变化，分为'静'、'动卦/爻但还没变'、'动卦/爻已经变了'3个状态
 */
export const enum 动静状态 {
  静,
  动未变,
  动已变,
}

export class 爻 {
  // #region static methods
  /**
   * Creating a Yao from symbolName.
   * @param symbolName e.g. '交' for 0, '单' for 1, '拆' for 2, '重' for 3.
   * @returns 如果入参符合就返回，如果不符合就返回`null`
   */
  static 从单拆重交创建(symbolName: string): 爻 | null {
    const index = '交单拆重'.indexOf(symbolName);
    return index !== -1 ? new 爻(index) : null;
  }

  /**
   * Creating a Yao from name.
   * @param name e.g. '老阴', '少阳', '少阴', '老阳'.
   * @returns 如果入参符合就返回，如果不符合就返回`null`
   */
  static 从名称创建(name: string): 爻 | null {
    const index = _names.indexOf(name as any);
    return index !== -1 ? new 爻(index) : null;
  }

  /**
   * @param digit e.g. '0', '1', '2', '3'.
   * @returns 如果入参符合就返回，如果不符合就返回`null`
   */
  static 从阳数字符串创建(digit: string): 爻 | null {
    const index = '0123'.indexOf(digit);
    return index !== -1 ? new 爻(index) : null;
  }

  /**
   * Create a Yao from any Trigram field value.
   * @param value `{id: '坤', binary: '000', yangs: 0}`, so `'坤'`, `'000'` and `0` can all be used.
   * @returns 如果入参符合就返回，如果不符合就返回`null`
   */
  static 从八卦字段创建(value: string | number): 爻 | null {
    const trigram = 八卦表.find(
      (v) => v.卦名 === value || v.阳数 === value || v.二进制表示 === value || v.符号 === value,
    );
    return trigram ? new 爻(trigram.阳数) : null;
  }
  // #endregion

  #阳数: 0 | 1 | 2 | 3;

  #动静状态: 动静状态;

  /**
   * How many faces of character of 3 coins in this Yao.
   * It can only be 0, 1, 2 or 3, which corresponds to 老阴、少阳、少阴、老阳 respectively.
   * - 0: 老阴 (all three coins are 阴面)
   * - 1: 少阳 (one coin is 阳面, two coins are 阴面)
   * - 2: 少阴 (two coins are 阳面, one coin is 阴面)
   * - 3: 老阳 (all three coins are 阳面)
   */
  get 阳数() {
    return this.#阳数;
  }

  get 动静状态() {
    return this.#动静状态;
  }

  /**
   * 两仪, aka 阴阳
   */
  get 阴阳(): '阴' | '阳' {
    return '阴阳阴阳'[this.#阳数] as '阴' | '阳';
  }

  get 名称(): '老阴' | '少阳' | '少阴' | '老阳' {
    return _names[this.#阳数];
  }

  get 符号(): '单' | '拆' | '重' | '交' {
    return '交单拆重'[this.#阳数] as '单' | '拆' | '重' | '交';
  }

  constructor(阳数: number, 状态?: 动静状态) {
    if (阳数 !== 0 && 阳数 !== 1 && 阳数 !== 2 && 阳数 !== 3) {
      throw new TypeError('阳数只能是 0, 1, 2 或 3');
    }

    if (状态 === undefined) {
      状态 = 阳数 === 0 || 阳数 === 3 ? 动静状态.动未变 : 动静状态.静;
    }

    if (状态 === 动静状态.静 && (阳数 === 0 || 阳数 === 3)) {
      throw new TypeError('静爻不能是老阴或老阳');
    }

    this.#阳数 = 阳数;
    this.#动静状态 = 状态;
  }

  /**
   * 判断是否同为阴爻或同为阳爻
   */
  是否阳数相等(other: 爻): boolean {
    return this.#阳数 === other.#阳数;
  }

  /**
   * 判断是否同为阴爻或同为阳爻，且是否变过的状态也相同
   * - 阳数和状态相同视为全同
   */
  是否全同(other: 爻): boolean {
    return this.#阳数 === other.#阳数 && this.#动静状态 === other.#动静状态;
  }

  /**
   * 克隆一个全新的和本身一样的爻对象
   */
  克隆(): 爻 {
    return new 爻(this.#阳数, this.#动静状态);
  }

  /**
   * 得到新的爻对象，这个爻是变过的。
   * @returns 如果是静爻或者已变过，则返回它自己
   */
  变(): 爻 {
    if (this.#动静状态 === 动静状态.动未变) {
      return new 爻(_change[this.#阳数], 动静状态.动已变);
    }
    return this;
  }
}
