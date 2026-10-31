import type { 八卦, 六十四卦 } from '../core/common.js';

import { 六十四卦表, 八宫卦位顺序表, 八卦表, 五行, 八卦名 } from '../core/common.js';
import { 装天干 } from '../core/heaven-stem.js';
import { 装世应 } from '../core/host-guest.js';
import { 装六亲五行 } from '../core/six-kins.js';
import { 动静状态, 爻 } from './yao.js';

export const 爻位 = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;

const _scattering = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑', '无妄', '大壮'];
const _gathering = ['否', '泰', '复', '豫', '贲', '旅', '困', '节'];
const _pure = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑'];

/**
 * Hexagram class represents a hexagram, which consists of 6 Yao.
 * - Each Yao can be either yin or yang, and can be changing or not.
 * - The hexagram can be constructed from an array of Yao or an array of counts of yang.
 * - Creates “乾为天” by default.
 */
export class 六爻卦 implements 六十四卦 {
  // #region Static
  /**
   * Use tokens like `'012132'` to create a Hexagram, where each digit represents the count of Yang in the corresponding Yao (0 for 老阴, 1 for 少阳, 2 for 少阴, 3 for 老阳). The first digit represents the first Yao (初爻) and the last digit represents the sixth Yao (上爻).
   */
  static 从阳数字符串创建(quaternary: string): 六爻卦 | null {
    const yaos = quaternary.split('').map(爻.从阳数字符串创建);
    return yaos.every((y): y is 爻 => y !== null) ? new 六爻卦(yaos) : null;
  }

  /**
   * Use tokens like `'单单拆拆重重'` to create a Hexagram.
   *
   * Since 交 is 0, 单 is 1, 拆 is 2, and 重 is 3, the above token is equivalent to '112233'.
   * Which returns '风泽中孚' with its 5th and 6th Yao being dynamic.
   */
  static 从单拆重交创建(symbolNames: string): 六爻卦 | null {
    const yaos = symbolNames.split('').map(爻.从单拆重交创建);
    return yaos.every((y): y is 爻 => y !== null) ? new 六爻卦(yaos) : null;
  }

  /**
   * Try to create a Hexagram from an array of counts of Yang. If the input is invalid, null will be returned.
   */
  static 从阳数创建(counts: number[]): 六爻卦 | null {
    try {
      return new 六爻卦(counts.map((c) => new 爻(c)));
    } catch {
      return null;
    }
  }

  /**
   * Create a Hexagram from its id, which is the name of the hexagram without the palace name.
   * @param name "坤为地", "地雷复", "地水师"
   */
  static 从卦名创建(name: string): 六爻卦 | null {
    const exist = 六十四卦表.find(
      (h) => h.全名 === name || h.全名.slice(2) === name || (h.全名.startsWith(name) && name.length > 1),
    );
    return exist ? 六爻卦.从阳数字符串创建(exist.二进制表示) : null;
  }

  // #endregion

  /**
   * 6 Yao positions, indexed from bottom to top.
   * Index from 0 to 5, where 0 is the first Yao (初爻) and 5 is the sixth Yao (上爻).
   */
  #六爻: [爻, 爻, 爻, 爻, 爻, 爻];

  /**
   * 指向六爻卦象信息的对象，外部不可更改
   */
  #信息: 六十四卦;

  /**
   * 只含有阴阳的二进制表示
   * - `100100`代表震为雷
   */
  #二进制表示: string;

  /**
   * Whether this hexagram has already changed to another hexagram. Once a hexagram is changed, it cannot change again.
   */
  #动静状态: 动静状态;

  /**
   * 下三爻组成的卦
   */
  #内卦: 八卦;

  /**
   * 上三爻组成的卦
   */
  #外卦: 八卦;

  /**
   * Whether this gram is 六冲、六合
   */
  #六冲六合: '六冲' | '六合' | undefined;

  #是否为八纯卦: boolean;

  /**
   * Includes 六亲、天干、地支、五行. Looks like "兄弟癸丑土" "官鬼辛卯木"
   */
  #六亲干支五行: string[];

  /**
   * Index of the 世爻
   */
  #世爻: 0 | 1 | 2 | 3 | 4 | 5;

  /**
   * Index of the 应爻
   */
  #应爻: 0 | 1 | 2 | 3 | 4 | 5;

  /**
   * Create a Hexagram from an array of Yao with length 6.
   * @param 六爻 从初爻到上爻6个爻组成的数组
   */
  constructor(六爻: 爻[], 状态?: 动静状态) {
    if (六爻.length !== 6 || 六爻.some((a) => !(a instanceof 爻))) {
      throw new TypeError('第一个参数必须是6个爻对象');
    }

    // 动静必须符合要求

    if (状态 === undefined) {
      状态 = 六爻.some((v) => v.动静状态 !== 动静状态.静) ? 动静状态.动未变 : 动静状态.静;
    }

    this.#六爻 = 六爻.map((a) => a.克隆()) as [爻, 爻, 爻, 爻, 爻, 爻];
    this.#二进制表示 = this.#六爻.map((y) => (y.阴阳 === '阳' ? '1' : '0')).join('');
    // 一定能搜索到，因为爻数已经校验过
    this.#信息 = 六十四卦表.find((h) => h.二进制表示 === this.二进制表示)!;
    this.#动静状态 = 状态;

    const ub = this.#二进制表示.slice(0, 3);
    const lb = this.#二进制表示.slice(3);
    this.#内卦 = 八卦表.find((t) => t.二进制表示 === ub)!;
    this.#外卦 = 八卦表.find((t) => t.二进制表示 === lb)!;

    const 六亲数组 = 装六亲五行(this);
    const 天干数组 = 装天干(this);
    const 内卦装 = this.#内卦.内卦地支五行.map((地支五行, i) => 六亲数组[i + 0] + 天干数组[i + 0] + 地支五行);
    const 外卦装 = this.#外卦.外卦地支五行.map((地支五行, i) => 六亲数组[i + 3] + 天干数组[i + 3] + 地支五行);
    this.#六亲干支五行 = [...内卦装, ...外卦装];

    const hg = 装世应(this);
    this.#世爻 = hg.世;
    this.#应爻 = hg.应;

    // special types

    if (_scattering.includes(this.#信息.卦名)) {
      this.#六冲六合 = '六冲';
    }
    if (_gathering.includes(this.#信息.卦名)) {
      this.#六冲六合 = '六合';
    }

    this.#是否为八纯卦 = _pure.includes(this.#信息.卦名);
  }

  get 六爻(): [爻, 爻, 爻, 爻, 爻, 爻] {
    return [...this.#六爻];
  }

  get 阳数(): number[] {
    return this.#六爻.map((v) => v.阳数);
  }

  get 宫位信息(): string {
    return `${this.#信息.宫}宫（${this.#信息.五行}）${八宫卦位顺序表[this.#信息.八宫卦位]}`;
  }

  get 动静状态(): 动静状态 {
    return this.#动静状态;
  }

  get 六亲干支五行(): string[] {
    return [...this.#六亲干支五行];
  }

  /**
   * 返回世爻所在的index（0表示初爻，5表示上爻）
   */
  get 世爻(): 0 | 1 | 2 | 3 | 4 | 5 {
    return this.#世爻;
  }

  /**
   * 返回应爻所在的index（0表示初爻，5表示上爻）
   */
  get 应爻(): 0 | 1 | 2 | 3 | 4 | 5 {
    return this.#应爻;
  }

  get 六冲六合(): '六冲' | '六合' | undefined {
    return this.#六冲六合;
  }

  get 是否为八纯卦(): boolean {
    return this.#是否为八纯卦;
  }

  get 内卦(): 八卦 {
    return this.#内卦;
  }

  get 外卦(): 八卦 {
    return this.#外卦;
  }

  // #region 实现六十四卦信息接口，快捷访问
  get 二进制表示(): string {
    return this.#二进制表示;
  }

  get 卦名(): string {
    return this.#信息.卦名;
  }

  get 全名(): string {
    return this.#信息.全名;
  }

  get 符号(): string {
    return this.#信息.符号;
  }

  get 五行(): 五行 {
    return this.#信息.五行;
  }

  get 宫(): 八卦名 {
    return this.#信息.宫;
  }

  get 八宫卦位() {
    return this.#信息.八宫卦位;
  }
  // #endregion

  /**
   * 获得变爻卦象
   * @returns 变爻卦象，如果卦象静则返回它自己
   */
  变(): 六爻卦 {
    if (this.#动静状态 === 动静状态.动未变) {
      return new 六爻卦(
        this.#六爻.map((y) => y.变()),
        动静状态.动已变,
      );
    }

    return this;
  }

  克隆(): 六爻卦 {
    return new 六爻卦(this.#六爻, this.#动静状态);
  }

  toString(): string {
    return this.全名;
  }

  [Symbol.toPrimitive]() {
    return this.全名;
  }
}
