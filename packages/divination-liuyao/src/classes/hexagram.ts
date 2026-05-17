import { HexagramInfoTable, PalaceOrderTable, type HexagramInfo } from '../core/common.js';
import { Yao } from './yao.js';

type LiuYao = [Yao, Yao, Yao, Yao, Yao, Yao];
export const HexagramYaoOrder = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;

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

  /**
   * Create a Hexagram from its id, which is the name of the hexagram without the palace name.
   * @param id "坤为地", "地雷复", "地水师"
   */
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

  get palace(): string {
    const i = this.info;
    return `${i.palace}宫（${i.phase}）${PalaceOrderTable[i.palaceIndex].name}`;
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
    const hostIndex = this.info.setupInfo.findIndex((s) => s.hostGuest === '世');
    const guestIndex = this.info.setupInfo.findIndex((s) => s.hostGuest === '应');
    const infos: string[] = [
      `本卦${this.info.id}`,
      `世爻为${HexagramYaoOrder[hostIndex]}`,
      `应爻为${HexagramYaoOrder[guestIndex]}`,
    ];
    const changed = this.toChanged();
    if (changed) {
      infos.push(
        `${this.yaos
          .map((y, i) => (y.isDynamic ? `${HexagramYaoOrder[i]}` : null))
          .filter((s): s is string => s !== null)
          .join('、')}是动爻`,
      );
      infos.push(`变卦为${changed.info.id}`);

      const changedHostIndex = changed.info.setupInfo.findIndex((s) => s.hostGuest === '世');
      if (this.yaos[changedHostIndex].isDynamic) {
        infos.push(`变卦世爻为${HexagramYaoOrder[changedHostIndex]}`);
      } else {
        infos.push(`未变出新的世爻`);
      }

      const changedGuestIndex = changed.info.setupInfo.findIndex((s) => s.hostGuest === '应');
      if (this.yaos[changedGuestIndex].isDynamic) {
        infos.push(`变卦应爻为${HexagramYaoOrder[changedGuestIndex]}`);
      } else {
        infos.push(`未变出新的应爻`);
      }
    } else {
      infos.push('无动爻');
    }
    return infos.join('，');
  }

  /**
   * This output is meant for AI skills.
   */
  toAIReadable(): { 本卦: HexagramAIReadable<'本卦'>; 变卦: HexagramAIReadable<'变卦'> | null; 世应变化: string } {
    const si = this.info.setupInfo;
    const changed = this.toChanged();
    const csi = changed?.info.setupInfo;

    const hostGuestChange: string[] = [];
    if (csi) {
      const dynamicIndexes = this.yaos.map((y, i) => (y.isDynamic ? i : null)).filter((y) => y !== null);
      csi.forEach((s, i) => {
        if (dynamicIndexes.includes(i)) {
          if (s.hostGuest === '世') {
            hostGuestChange.push(`新世爻为${changed.info.id}的${HexagramYaoOrder[i]}`);
          }
          if (s.hostGuest === '应') {
            hostGuestChange.push(`新应爻为${changed.info.id}的${HexagramYaoOrder[i]}`);
          }
        }
      });
    } else {
      hostGuestChange.push('没有新的世应爻出现，世应不变');
    }

    return {
      本卦: {
        上爻: {
          爻: this.yaos[5].name,
          类型: si[5].hostGuest || null,
          六亲地支五行: si[5].kin,
        },
        五爻: {
          爻: this.yaos[4].name,
          类型: si[4].hostGuest || null,
          六亲地支五行: si[4].kin,
        },
        四爻: {
          爻: this.yaos[3].name,
          类型: si[3].hostGuest || null,
          六亲地支五行: si[3].kin,
        },
        三爻: {
          爻: this.yaos[2].name,
          类型: si[2].hostGuest || null,
          六亲地支五行: si[2].kin,
        },
        二爻: {
          爻: this.yaos[1].name,
          类型: si[1].hostGuest || null,
          六亲地支五行: si[1].kin,
        },
        初爻: {
          爻: this.yaos[0].name,
          类型: si[0].hostGuest || null,
          六亲地支五行: si[0].kin,
        },
        卦名: this.info.id,
        宫: this.palace,
        变爻: this.isDynamic
          ? this.yaos
              .map((y, i) => (y.isDynamic ? HexagramYaoOrder[i] : null))
              .filter((s): s is '初爻' | '二爻' | '三爻' | '四爻' | '五爻' | '上爻' => s !== null)
          : undefined,
      },
      变卦: csi
        ? {
            上爻: {
              爻: changed.yaos[5].name,
              类型: csi[5].hostGuest || null,
              六亲地支五行: csi[5].kin,
            },
            五爻: {
              爻: changed.yaos[4].name,
              类型: csi[4].hostGuest || null,
              六亲地支五行: csi[4].kin,
            },
            四爻: {
              爻: changed.yaos[3].name,
              类型: csi[3].hostGuest || null,
              六亲地支五行: csi[3].kin,
            },
            三爻: {
              爻: changed.yaos[2].name,
              类型: csi[2].hostGuest || null,
              六亲地支五行: csi[2].kin,
            },
            二爻: {
              爻: changed.yaos[1].name,
              类型: csi[1].hostGuest || null,
              六亲地支五行: csi[1].kin,
            },
            初爻: {
              爻: changed.yaos[0].name,
              类型: csi[0].hostGuest || null,
              六亲地支五行: csi[0].kin,
            },
            卦名: changed.info.id,
            宫: changed.palace,
          }
        : null,
      世应变化: hostGuestChange.join('，'),
    };
  }

  // #region Utility Methods
  clone(): Hexagram {
    return new Hexagram(this.yaos);
  }

  toString(): string {
    return this.info.id;
  }

  [Symbol.toPrimitive]() {
    return this.info.id;
  }
  // #endregion
}

// #region Hexagram Json is for AI skills
interface YaoInfo {
  爻: string; // 少阴少阳老阴老阳
  类型: '世' | '应' | null;
  六亲地支五行: string; // 例如：父金、兄弟水、妻财木等
}

interface HexagramAIReadable<T extends '本卦' | '变卦'> {
  初爻: YaoInfo;
  二爻: YaoInfo;
  三爻: YaoInfo;
  四爻: YaoInfo;
  五爻: YaoInfo;
  上爻: YaoInfo;
  卦名: string;
  宫: string;
  变爻?: string[];
}
// #endregion
