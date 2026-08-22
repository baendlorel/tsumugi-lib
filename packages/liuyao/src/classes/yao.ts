import { TrigramInfoTable } from '../core/common.js';

const _names = ['老阴', '少阳', '少阴', '老阳'] as const;
const _symbolNames = '交单拆重' as const;
const _patterns = '×’”○' as const;
const _digits = '0123' as const;
const _change = [1, 1, 2, 2] as const;
const _countToPolar = [0, 1, 0, 1] as const;

export class Yao {
  // #region static methods
  /**
   * Returns 老阴、老阳、少阴、少阳
   */
  static getName(yangs: number) {
    return _names[yangs];
  }

  /**
   * Support creating a Yao from various types of input:
   * - A symbol representing the Yao (e.g. '交', '单', '拆', '重')
   * - A name representing the Yao (e.g. '老阴', '少阳', '少阴', '老阳')
   * - A digit representing the count of yang (e.g. '0', '1', '2', '3')
   * - Symbols in ancient books representing a Yao ()
   * - A field of a TrigramInfo object (e.g. id, binary, nameEn, represents, representsEn, sign)
   * If the input matches any of these, a corresponding Yao will be created.
   * Otherwise, null will be returned.
   */

  /**
   * Creating a Yao from symbol.
   * @param symbol e.g. '×' for 0, '’' for 1, '”' for 2, '○' for 3.
   */
  static fromSymbol(symbol: string): Yao | null {
    const index = _patterns.indexOf(symbol);
    return index !== -1 ? new Yao(index) : null;
  }

  /**
   * Creating a Yao from symbolName.
   * @param symbolName e.g. '交' for 0, '单' for 1, '拆' for 2, '重' for 3.
   */
  static fromSymbolName(symbolName: string): Yao | null {
    const index = _symbolNames.indexOf(symbolName);
    return index !== -1 ? new Yao(index) : null;
  }

  /**
   * Creating a Yao from name.
   * @param name e.g. '老阴', '少阳', '少阴', '老阳'.
   */
  static fromName(name: string): Yao | null {
    const index = _names.indexOf(name as any);
    return index !== -1 ? new Yao(index) : null;
  }

  /**
   * Create a Yao from a digit string representing the count of yang.
   */
  static fromDigitString(digit: string): Yao | null {
    const index = _digits.indexOf(digit);
    return index !== -1 ? new Yao(index) : null;
  }

  /**
   * Create a Yao from any Trigram field value.
   * @param value `{id: '坤', binary: '000', yangs: 0}`, so `'坤'`, `'000'` and `0` can all be used.
   */
  static fromTrigramField(value: string | number): Yao | null {
    const trigram = TrigramInfoTable.find(
      (v) => v.id === value || v.yangs === value || v.binary === value || v.sign === value,
    );
    return trigram ? new Yao(trigram.yangs) : null;
  }
  // #endregion

  /**
   * How many faces of character of 3 coins in this Yao.
   * It can only be 0, 1, 2 or 3, which corresponds to 老阴、少阳、少阴、老阳 respectively.
   * - 0: 老阴 (all three coins are 阴面)
   * - 1: 少阳 (one coin is 阳面, two coins are 阴面)
   * - 2: 少阴 (two coins are 阳面, one coin is 阴面)
   * - 3: 老阳 (all three coins are 阳面)
   */
  readonly yangs: 0 | 1 | 2 | 3;

  /**
   * 两仪, aka 阴阳
   */
  readonly polar: 0 | 1;

  /**
   * If this Yao is dynamic, which means it can change to another Yao. In LiuYao, only 老阴 and 老阳 are dynamic.
   * - 老阴 (0) can change to 少阳 (1)
   * - 老阳 (3) can change to 少阴 (2)
   * - 少阳 (1) and 少阴 (2) cannot change, so they are static.
   */
  readonly dynamic;

  /**
   * Whether this Yao has already changed to another Yao. Once a Yao is changed, it cannot change again.
   */
  readonly isChanged: boolean; /**
   * The symbol representing this Yao, which is one of '×', '’', '”', '○'.
   */
  readonly pattern: '×' | '’' | '”' | '○';

  readonly name: '老阴' | '少阳' | '少阴' | '老阳';

  readonly symbol: '单' | '拆' | '重' | '交';

  constructor(yangs: number, isChanged = false) {
    if (yangs !== 0 && yangs !== 1 && yangs !== 2 && yangs !== 3) {
      throw new Error('Count of yang must be 0, 1, 2 or 3');
    }
    this.yangs = yangs;
    this.isChanged = isChanged;
    this.polar = _countToPolar[yangs];
    this.dynamic = yangs === 0 || yangs === 3;
    this.pattern = _patterns[yangs] as '×' | '’' | '”' | '○';
    this.name = _names[yangs];
    this.symbol = _symbolNames[yangs] as '单' | '拆' | '重' | '交';

    if (this.dynamic && this.isChanged) {
      throw new Error(`Changed Yao should not be dynamic.`);
    }
  }

  /**
   * Consider the Yaos are same if `this.yangs` is same
   */
  eq(other: Yao): boolean {
    return this.yangs === other.yangs;
  }

  /**
   * Consider the Yaos are `===` if:
   * 1. `this.yangs` is same
   * 2. `this.isChanged` is same
   */
  eqeqeq(other: Yao): boolean {
    return this.yangs === other.yangs && this.isChanged === other.isChanged;
  }

  clone(): Yao {
    return new Yao(this.yangs, this.isChanged);
  }

  toChanged(): Yao {
    return new Yao(_change[this.yangs], this.dynamic); // & This is the simplified version.
  }
}
