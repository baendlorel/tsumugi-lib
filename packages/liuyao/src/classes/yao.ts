import { TrigramInfoTable } from '../core/common.js';

const _names = ['老阴', '少阳', '少阴', '老阳'] as const;
const _symbolNames = '交单拆重' as const;
const _symbols = '×’”○' as const;
const _digits = '0123' as const;
const _countChange = [1, 1, 2, 2] as const;
const _countToPolar = [0, 1, 0, 1] as const;

function validYangCount(v: number): asserts v is 0 | 1 | 2 | 3 {
  if (v !== 0 && v !== 1 && v !== 2 && v !== 3) {
    throw new Error('Count of yang must be 0, 1, 2 or 3');
  }
}

export class Yao {
  static getName(yangCount: number) {
    return _names[yangCount];
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
    const index = _symbols.indexOf(symbol);
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
   * @param value `{id: '坤', binary: '000', yangCount: 0}`, so `'坤'`, `'000'` and `0` can all be used.
   */
  static fromTrigramField(value: string | number): Yao | null {
    const trigram = TrigramInfoTable.find(
      (v) =>
        v.id === value ||
        v.yangCount === value ||
        v.binary === value ||
        v.nameEn === value ||
        v.represents === value ||
        v.representsEn === value ||
        v.sign === value,
    );
    return trigram ? new Yao(trigram.yangCount) : null;
  }

  private _yangCount: 0 | 1 | 2 | 3;

  /**
   * How many faces of character of 3 coins in this Yao.
   * It can only be 0, 1, 2 or 3, which corresponds to 老阴、少阳、少阴、老阳 respectively.
   * - 0: 老阴 (all three coins are Yin)
   * - 1: 少阳 (one coin is Yang, two coins are Yin)
   * - 2: 少阴 (two coins are Yang, one coin is Yin)
   * - 3: 老阳 (all three coins are Yang)
   */
  get yangCount() {
    return this._yangCount;
  }

  /**
   * Two Polars.
   * - 0 represents Yin 阴
   * - 1 represents Yang 阳
   */
  get polar(): 0 | 1 {
    return _countToPolar[this.yangCount];
  }

  /**
   * If this Yao is dynamic, which means it can change to another Yao. In LiuYao, only 老阴 and 老阳 are dynamic.
   * - 老阴 (0) can change to 少阳 (1)
   * - 老阳 (3) can change to 少阴 (2)
   * - 少阳 (1) and 少阴 (2) cannot change, so they are static.
   */
  get isDynamic(): boolean {
    return this.yangCount === 0 || this.yangCount === 3;
  }

  /**
   * Whether this Yao has already changed to another Yao. Once a Yao is changed, it cannot change again.
   */
  readonly isChanged: boolean;

  /**
   * @returns The symbol representing this Yao, which is one of '×', '’', '”', '○'.
   */
  get symbol() {
    return _symbols[this.yangCount];
  }

  get symbolName() {
    return _symbolNames[this.yangCount];
  }

  get name() {
    return _names[this.yangCount];
  }

  constructor(yangCount: number, isChanged: boolean = false) {
    validYangCount(yangCount);
    this._yangCount = yangCount;
    this.isChanged = isChanged;
  }

  eq(other: Yao): boolean {
    return this.yangCount === other.yangCount;
  }

  /**
   * Change `this.yangCount`
   */
  set(yangCount: number) {
    validYangCount(yangCount);
    this._yangCount = yangCount;
  }

  clone(): Yao {
    return new Yao(this.yangCount, this.isChanged);
  }

  toChanged(): Yao {
    if (this.isDynamic) {
      // & 这里要注意，Yao的构造函数传入的是阳数量而不是两仪
      return new Yao(_countChange[this.yangCount], true);
    } else {
      return new Yao(this.yangCount, false);
    }
  }
}
