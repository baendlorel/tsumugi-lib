import { Trigram } from '../core/common.js';

const _names = ['老阴', '少阳', '少阴', '老阳'] as const;
const _symsName = ['交', '单', '拆', '重'] as const;
const _syms = ['×', '’', '”', '○'] as const;
const _digits = ['0', '1', '2', '3'] as const;
const _countChange = [1, 1, 2, 2] as const;
const _countToPolar = [0, 1, 0, 1] as const;

const assertCountOfYang: (v: number) => asserts v is 0 | 1 | 2 | 3 = (v) => {
  if (![0, 1, 2, 3].includes(v)) {
    throw new Error('三枚硬币的阳数必须为0、1、2或3');
  }
};

export class Yao {
  static getName(countOfYang: number) {
    return _names[countOfYang];
  }

  /**
   * 支持各种各样入参创建爻实例，如果解析失败则返回null
   */
  static from(arg: any): Yao | null {
    // 尝试从字符创建
    if (_symsName.includes(arg)) {
      return new Yao(_names.indexOf(arg));
    }
    if (_syms.includes(arg)) {
      return new Yao(_syms.indexOf(arg));
    }
    if (_digits.includes(arg)) {
      return new Yao(_digits.indexOf(arg));
    }

    // 尝试从八卦创建
    const trigram = Trigram.findByName(arg);
    if (trigram) {
      return new Yao(trigram.yangCount);
    }

    return null;
  }

  /**
   * 一切的基础，3枚硬币有多少个阳面
   */
  private _countOfYang: 0 | 1 | 2 | 3;

  get countOfYang() {
    return this._countOfYang;
  }

  /**
   * 两仪，是阴爻还是阳爻
   */
  get polar(): 0 | 1 {
    return _countToPolar[this.countOfYang];
  }

  /**
   * 是否为动爻
   */
  get isDynamic(): boolean {
    return this.countOfYang === 0 || this.countOfYang === 3;
  }

  /**
   * 是否已经变化过了
   */
  readonly isChanged: boolean;

  /**
   * 标记符号，因symbol为类型名故不用作变量名
   * 有
   */
  get sym() {
    return _syms[this.countOfYang];
  }

  get name() {
    return _names[this.countOfYang];
  }

  constructor(countOfYang: number, isChanged: boolean = false) {
    assertCountOfYang(countOfYang);
    this._countOfYang = countOfYang;
    this.isChanged = isChanged;
  }

  /**
   * Change `this.countOfYang`
   */
  set(countOfYang: number) {
    assertCountOfYang(countOfYang);
    this._countOfYang = countOfYang;
  }

  clone(): Yao {
    return new Yao(this.countOfYang, this.isChanged);
  }

  toChanged(): Yao {
    if (this.isDynamic) {
      // & 这里要注意，Yao的构造函数传入的是阳数量而不是两仪
      return new Yao(_countChange[this.countOfYang], true);
    } else {
      return new Yao(this.countOfYang, false);
    }
  }
}
