import { HexagramInfoTable, type HexagramInfo } from '../core/common.js';
import { Yao } from './yao.js';

type LiuYao = [Yao, Yao, Yao, Yao, Yao, Yao];
export const HexagramYaoIndex = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;

/**
 * Hexagram class represents a hexagram, which consists of 6 Yao.
 * - Each Yao can be either yin or yang, and can be changing or not.
 * - The hexagram can be constructed from an array of Yao or an array of counts of yang.
 * - Creates “乾为天” by default.
 */
export class Hexagram {
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

  static fromId(id: string): Hexagram | null {
    const exist = HexagramInfoTable.find(
      (h) => h.id === id || h.id.slice(2) === id || (h.id.startsWith(id) && id.length > 1),
    );
    return exist ? Hexagram.fromYangCounts(exist.yangCounts) : null;
  }

  /**
   * Find Original Palace Hexagram by the palace name, which is the last character of the hexagram id. For example, '天' for '乾为天', '地' for '坤为地', etc.
   */
  static fromPalace(palace: string): Hexagram | null {
    const exist = HexagramInfoTable.find((h) => h.id[2] === palace);
    return exist ? Hexagram.fromYangCounts(exist.yangCounts) : null;
  }

  /**
   * 6 Yao positions, indexed from bottom to top.
   * Index from 0 to 5, where 0 is the first Yao (初爻) and 5 is the sixth Yao (上爻).
   */
  readonly yaos: LiuYao;

  /**
   * HexagramInfo of this hexagram, which can be used to get more information about this hexagram, such as its name, sign, phase, palace, etc.
   */
  get info(): HexagramInfo {
    return HexagramInfoTable.find((h) => h.binary === this.yaos.map((y) => y.polar).join(''))!;
  }

  /**
   * Whether the 6 Yaos of this hexagram contain any dynamic Yao.
   */
  get isDynamic(): boolean {
    return this.yaos.some((y) => y.isDynamic || y.isChanged);
  }

  /**
   * Whether this hexagram has already changed to another hexagram. Once a hexagram is changed, it cannot change again.
   */
  get isChanged(): boolean {
    return this.yaos.some((y) => y.isChanged);
  }

  /**
   * Outer trigram of this hexagram, which consists of the last three yao (四爻、五爻、上爻).
   * @returns A trigram if the outer trigram is dynamic.
   */
  get dynamicOuter(): boolean {
    return this.yaos.slice(3).some((y) => y.isDynamic || y.isChanged);
  }

  /**
   * Inner trigram of this hexagram, which consists of the first three yao (初爻、二爻、三爻).
   * @returns A trigram if the inner trigram is dynamic.
   */
  get dynamicInner(): boolean {
    return this.yaos.slice(0, 3).some((y) => y.isDynamic || y.isChanged);
  }

  /**
   * Create a Hexagram from an array of Yao with length 6.
   */
  constructor(yaos: Yao[]) {
    if (yaos.length !== 6) {
      throw new Error('Array length mismatch, A Hexagram must be constructed with exactly 6 Yaos or 6 counts of yang');
    }

    if (yaos.every((a) => a instanceof Yao)) {
      this.yaos = yaos.map((a) => a.clone()) as LiuYao;
    } else {
      throw new Error('Invalid Arguments, Hexagram must be constructed with exactly 6 Yaos or 6 counts of yang');
    }
  }

  setYao(index: number, yangCount: number): void {
    this.yaos[index].set(yangCount);
  }

  toChanged(): Hexagram | null {
    if (!this.isDynamic) {
      return null;
    }

    if (this.isChanged) {
      throw new Error('已经是变卦了，无法再变');
    }

    return new Hexagram(this.yaos.map((y) => y.toChanged()));
  }

  /**
   * Describe this hexagram in a human-readable way, including the original hexagram, the changed hexagram (if any), and the dynamic yao (if any).
   * - e.g.：“本卦乾为天，变卦坤为地，动爻：初爻、三爻”
   */
  toDescription(): string {
    const infos: string[] = [`本卦${this.info.id}`];
    const changed = this.toChanged();
    if (changed) {
      infos.push(`变卦${changed.info.id}`);
      infos.push(
        `动爻：${this.yaos
          .map((y, i) => (y.isDynamic ? `${HexagramYaoIndex[i]}` : null))
          .filter((s): s is string => s !== null)
          .join('、')}`,
      );
    } else {
      infos.push('无动爻');
    }
    return infos.join('，');
  }

  toDescriptionEn(): string {
    const infos: string[] = [`Original Hexagram ${this.info.id}`];
    const changed = this.toChanged();
    if (changed) {
      infos.push(`Changed Hexagram ${changed.info.id}`);
      infos.push(
        `Dynamic Yaos: ${this.yaos
          .map((y, i) => (y.isDynamic ? `${HexagramYaoIndex[i]}` : null))
          .filter((s): s is string => s !== null)
          .join(', ')}`,
      );
    } else {
      infos.push('No dynamic Yao');
    }
    return infos.join(', ');
  }

  clone(): Hexagram {
    return new Hexagram(this.yaos);
  }

  toString(): string {
    return this.info.id;
  }

  [Symbol.toPrimitive](hint: string) {
    return this.info.id;
  }
}
