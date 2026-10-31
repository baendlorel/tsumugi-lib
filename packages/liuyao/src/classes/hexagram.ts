import {
  六爻卦象信息表,
  八宫卦位顺序表,
  type 八卦信息,
  type 六爻卦象信息 as 六爻卦象信息,
  八卦信息表,
} from '../core/common.js';
import { setupHeavenStem } from '../core/heaven-stem.js';
import { setupHostGuest } from '../core/host-guest.js';
import { setupSixKins } from '../core/six-kins.js';
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
export class 六爻卦象 implements 六爻卦象信息 {
  // #region Static
  /**
   * Use tokens like `'012132'` to create a Hexagram, where each digit represents the count of Yang in the corresponding Yao (0 for 老阴, 1 for 少阳, 2 for 少阴, 3 for 老阳). The first digit represents the first Yao (初爻) and the last digit represents the sixth Yao (上爻).
   */
  static 从阳数字符串创建(quaternary: string): 六爻卦象 | null {
    const yaos = quaternary.split('').map(爻.从阳数字符串创建);
    return yaos.every((y): y is 爻 => y !== null) ? new 六爻卦象(yaos) : null;
  }

  /**
   * Use tokens like `'单单拆拆重重'` to create a Hexagram.
   *
   * Since 交 is 0, 单 is 1, 拆 is 2, and 重 is 3, the above token is equivalent to '112233'.
   * Which returns '风泽中孚' with its 5th and 6th Yao being dynamic.
   */
  static 从单拆重交创建(symbolNames: string): 六爻卦象 | null {
    const yaos = symbolNames.split('').map(爻.从单拆重交创建);
    return yaos.every((y): y is 爻 => y !== null) ? new 六爻卦象(yaos) : null;
  }

  /**
   * Try to create a Hexagram from an array of counts of Yang. If the input is invalid, null will be returned.
   */
  static 从阳数创建(counts: number[]): 六爻卦象 | null {
    try {
      return new 六爻卦象(counts.map((c) => new 爻(c)));
    } catch {
      return null;
    }
  }

  /**
   * Create a Hexagram from its id, which is the name of the hexagram without the palace name.
   * @param id "坤为地", "地雷复", "地水师"
   */
  static 从卦名创建(id: string): 六爻卦象 | null {
    const exist = 六爻卦象信息表.find(
      (h) => h.全名 === id || h.全名.slice(2) === id || (h.全名.startsWith(id) && id.length > 1),
    );
    return exist ? 六爻卦象.从阳数创建(exist.阳数) : null;
  }

  // #endregion

  /**
   * 6 Yao positions, indexed from bottom to top.
   * Index from 0 to 5, where 0 is the first Yao (初爻) and 5 is the sixth Yao (上爻).
   */
  readonly 六爻: [爻, 爻, 爻, 爻, 爻, 爻];

  // #region inherited from HexagramInfo
  readonly 阳数: number[];
  readonly 二进制表示: string;
  readonly 全名: string;
  readonly 卦名: string;
  readonly 符号: string;
  readonly 宫: '乾' | '坤' | '震' | '巽' | '坎' | '离' | '艮' | '兑';
  readonly 五行: '金' | '木' | '水' | '火' | '土';
  readonly 卦位: 0 | 6 | 1 | 2 | 3 | 4 | 5 | 7;
  // #endregion

  readonly palaceInfo;

  /**
   * Whether the 6 Yaos of this hexagram contain any dynamic Yao.
   */
  readonly 是否为动卦: boolean;

  /**
   * Whether this hexagram has already changed to another hexagram. Once a hexagram is changed, it cannot change again.
   */
  readonly 动静状态: 动静状态;

  readonly inner: 八卦信息;
  readonly outer: 八卦信息;

  /**
   * Whether this gram is 六冲、六合
   */
  readonly specialType?: '六冲' | '六合';

  /**
   * Whether this gram is "八纯卦"
   */
  readonly pure: boolean;

  /**
   * Includes 六亲、天干、地支、五行. Looks like "兄弟癸丑土" "官鬼辛卯木"
   */
  readonly kins: string[];

  /**
   * Index of the 世爻
   */
  readonly host: number;

  /**
   * Index of the 应爻
   */
  readonly guest: number;

  /**
   * if it is a changed gram, this points to the primary one.
   */
  readonly primary: 六爻卦象 | null;

  /**
   * Create a Hexagram from an array of Yao with length 6.
   * @param 六爻 从初爻到上爻6个爻组成的数组
   */
  constructor(六爻: 爻[], primary: 六爻卦象 | null = null) {
    if (六爻.length !== 6 || 六爻.some((a) => !(a instanceof 爻))) {
      throw new TypeError('第一个参数必须是6个爻对象');
    }

    this.六爻 = 六爻.map((a) => a.克隆()) as [爻, 爻, 爻, 爻, 爻, 爻];
    this.二进制表示 = this.六爻.map((y) => y.阴阳).join('');
    const info = 六爻卦象信息表.find((h) => h.二进制表示 === this.二进制表示)!; // This is guaranteed
    this.宫 = info.宫;

    // properties from HexagramInfo
    this.全名 = info.全名;
    this.卦位 = info.卦位;
    this.阳数 = this.六爻.map((v) => v.阳数);
    this.五行 = info.五行;
    this.卦名 = info.卦名;
    this.符号 = info.符号;

    // details

    this.palaceInfo = `${info.宫}宫（${info.五行}）${八宫卦位顺序表[info.卦位]}`;

    this.是否为动卦 = this.六爻.some((y) => y.动静状态 !== 动静状态.静);
    this.动静状态 = primary ? 动静状态.动已变 : 动静状态.静;
    this.primary = primary;

    const ub = this.二进制表示.slice(0, 3);
    const lb = this.二进制表示.slice(3);
    this.inner = 八卦信息表.find((t) => t.二进制表示 === ub)!;
    this.outer = 八卦信息表.find((t) => t.二进制表示 === lb)!;

    const sixKins = setupSixKins(this);
    const hs = setupHeavenStem(this);
    this.kins = [
      ...this.inner.作为内卦.map((v, i) => sixKins[i] + hs[i] + v),
      ...this.outer.作为外卦.map((v, i) => sixKins[i + 3] + hs[i + 3] + v),
    ];

    const hg = setupHostGuest(this);
    this.host = hg.host;
    this.guest = hg.guest;

    // special types

    if (_scattering.includes(info.卦名)) {
      this.specialType = '六冲';
    }
    if (_gathering.includes(info.卦名)) {
      this.specialType = '六合';
    }

    this.pure = _pure.includes(info.卦名);
  }

  toChanged(): 六爻卦象 | null {
    if (!this.是否为动卦) {
      return null;
    }

    if (this.动静状态) {
      throw new Error('The gram is already changed, cannot change again.');
    }

    return new 六爻卦象(
      this.六爻.map((y) => y.获得变爻()),
      this,
    );
  }

  clone(): 六爻卦象 {
    return new 六爻卦象(this.六爻, this.primary);
  }

  toString(): string {
    return this.全名;
  }

  [Symbol.toPrimitive]() {
    return this.全名;
  }
}
