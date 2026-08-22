import {
  HexagramInfoTable,
  PalaceOrderTable,
  type TrigramInfo,
  type HexagramInfo,
  TrigramInfoTable,
} from '../core/common.js';
import { Yao } from './yao.js';

type LiuYao = [Yao, Yao, Yao, Yao, Yao, Yao];
export const HexagramYaoOrder = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;

export const enum Status {
  /**
   * 动卦
   */
  Dynamic,
  /**
   * 静卦
   */
  Static,
  /**
   * 变卦, no need to classify "动静“
   */
  None,
}

const _scattering = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑', '无妄', '大壮'];
const _gathering = ['否', '泰', '复', '豫', '贲', '旅', '困', '节'];
const _pure = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑'];

/**
 * Hexagram class represents a hexagram, which consists of 6 Yao.
 * - Each Yao can be either yin or yang, and can be changing or not.
 * - The hexagram can be constructed from an array of Yao or an array of counts of yang.
 * - Creates “乾为天” by default.
 */
export class Hexagram {
  // #region Static
  /**
   * Use tokens like `'012132'` to create a Hexagram, where each digit represents the count of Yang in the corresponding Yao (0 for 老阴, 1 for 少阳, 2 for 少阴, 3 for 老阳). The first digit represents the first Yao (初爻) and the last digit represents the sixth Yao (上爻).
   */
  static fromQuaternary(quaternary: string): Hexagram | null {
    const yaos = quaternary.split('').map(Yao.fromDigitString);
    return yaos.every((y): y is Yao => y !== null) ? new Hexagram(yaos) : null;
  }

  /**
   * Use tokens like `'单单拆拆重重'` to create a Hexagram.
   *
   * Since 交 is 0, 单 is 1, 拆 is 2, and 重 is 3, the above token is equivalent to '112233'.
   * Which returns '风泽中孚' with its 5th and 6th Yao being dynamic.
   */
  static fromSymbolName(symbolNames: string): Hexagram | null {
    const yaos = symbolNames.split('').map(Yao.fromSymbolName);
    return yaos.every((y): y is Yao => y !== null) ? new Hexagram(yaos) : null;
  }

  /**
   * Try to create a Hexagram from an array of counts of Yang. If the input is invalid, null will be returned.
   */
  static fromYangCounts(counts: number[]): Hexagram | null {
    try {
      return new Hexagram(counts.map((c) => new Yao(c)));
    } catch {
      return null;
    }
  }

  /**
   * Create a Hexagram from its id, which is the name of the hexagram without the palace name.
   * @param id "坤为地", "地雷复", "地水师"
   */
  static fromId(id: string): Hexagram | null {
    const exist = HexagramInfoTable.find(
      (h) => h.id === id || h.id.slice(2) === id || (h.id.startsWith(id) && id.length > 1),
    );
    return exist ? Hexagram.fromYangCounts(exist.yangs) : null;
  }

  /**
   * Find Original Palace Hexagram by the palace name, which is the last character of the hexagram id. For example, '天' for '乾为天', '地' for '坤为地', etc.
   */
  static fromPalace(palace: string): Hexagram | null {
    const exist = HexagramInfoTable.find((h) => h.id[2] === palace);
    return exist ? Hexagram.fromYangCounts(exist.yangs) : null;
  }
  // #endregion

  /**
   * 6 Yao positions, indexed from bottom to top.
   * Index from 0 to 5, where 0 is the first Yao (初爻) and 5 is the sixth Yao (上爻).
   */
  readonly yaos: LiuYao;

  /**
   * Binary version of the gram, like `001001`.
   * - Does not describe dynamic yaos, that is to say, 0 means 阴 not 老阴
   */
  readonly binary: string;

  /**
   * HexagramInfo of this hexagram, which can be used to get more information about this hexagram, such as its name, sign, phase, palace, etc.
   */
  readonly info: HexagramInfo;

  readonly palace: string;

  /**
   * There are 3 states of a hexagram, "动卦" "静卦" "变卦无所谓动静"
   */
  readonly status: Status;

  /**
   * Whether the 6 Yaos of this hexagram contain any dynamic Yao.
   */
  readonly isDynamic: boolean;

  /**
   * Whether this hexagram has already changed to another hexagram. Once a hexagram is changed, it cannot change again.
   */
  readonly isChanged: boolean;

  readonly inner: TrigramInfo;
  readonly outer: TrigramInfo;

  /**
   * Whether this gram is 六冲、六合
   */
  readonly specialType?: '六冲' | '六合';

  /**
   * Whether this gram is "八纯卦"
   */
  readonly pure: boolean;

  /**
   * Create a Hexagram from an array of Yao with length 6.
   */
  constructor(yaos: Yao[], isChanged = false) {
    if (yaos.length !== 6) {
      throw new Error('Array length mismatch, A Hexagram must be constructed with exactly 6 Yaos or 6 counts of yang');
    }

    if (yaos.some((a) => !(a instanceof Yao))) {
      throw new Error('Invalid Arguments, Hexagram must be constructed with exactly 6 Yaos or 6 counts of yang');
    }

    this.yaos = yaos.map((a) => a.clone()) as LiuYao;
    this.binary = this.yaos.map((y) => y.polar).join('');
    this.info = HexagramInfoTable.find((h) => h.binary === this.binary)!; // This is guaranteed
    this.palace = `${this.info.palace}宫（${this.info.phase}）${PalaceOrderTable[this.info.generation]}`;
    this.status = isChanged
      ? Status.None
      : this.yaos.some((y) => y.dynamic || y.isChanged)
        ? Status.Dynamic
        : Status.Static;

    this.isDynamic = this.status === Status.Dynamic;
    this.isChanged = isChanged;

    const ub = this.binary.slice(0, 3);
    const lb = this.binary.slice(3);
    this.inner = TrigramInfoTable.find((t) => t.binary === ub)!;
    this.outer = TrigramInfoTable.find((t) => t.binary === lb)!;

    if (_scattering.includes(this.info.name)) {
      this.specialType = '六冲';
    }
    if (_gathering.includes(this.info.name)) {
      this.specialType = '六合';
    }

    this.pure = _pure.includes(this.info.name);
  }

  toChanged(): Hexagram | null {
    if (!this.isDynamic) {
      return null;
    }

    if (this.isChanged) {
      throw new Error('The gram is already changed, cannot change again.');
    }

    return new Hexagram(
      this.yaos.map((y) => y.toChanged()),
      true,
    );
  }

  clone(): Hexagram {
    return new Hexagram(this.yaos, this.isChanged);
  }

  toString(): string {
    return this.info.id;
  }

  [Symbol.toPrimitive]() {
    return this.info.id;
  }
}
