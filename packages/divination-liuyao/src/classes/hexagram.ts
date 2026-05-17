import { Hexagrams, type HexagramInfo } from '../core/common.js';
import { Yao } from './yao.js';

export type LiuYao = [Yao, Yao, Yao, Yao, Yao, Yao];
export const YaoIndex = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;
let uid = 1;

/**
 * 64卦类，包含了卦象的基本信息和方法
 * - 默认创建“乾为天”
 */
export class Hexagram {
  static fromYaos(yaos: Yao[]): Hexagram | null {
    try {
      return new Hexagram(yaos);
    } catch (e) {
      return null;
    }
  }

  static fromId(id: string): Hexagram | null {
    const exist = Hexagrams.list.find(
      (h) => h.id === id || h.id.slice(2) === id || (h.id.startsWith(id) && id.length > 1),
    );
    return exist ? new Hexagram(exist.binary.split('').map((d) => (parseInt(d) === 1 ? 1 : 2))) : null;
  }

  /**
   * 本宫卦
   * - 用天、地、风...查找本宫卦
   */
  static fromIntrinsic(family: string): Hexagram | null {
    const exist = Hexagrams.list.find((h) => h.id[2] === family);
    return exist ? new Hexagram(exist.binary.split('').map((d) => (parseInt(d) === 1 ? 1 : 2))) : null;
  }

  readonly uid = uid++;

  /**
   * 6个爻位，从下往上标记。
   * 索引从0-5，0表示初爻，5表示上爻
   */
  readonly yaos: LiuYao;

  /**
   * 固定的卦象信息
   */
  get info(): HexagramInfo {
    return Hexagrams.findByYaos(this.yaos);
  }

  /**
   * 是否存在动爻
   */
  get isDynamic(): boolean {
    return this.yaos.some((y) => y.isDynamic || y.isChanged);
  }

  /**
   * 是否已经是变动过的卦象
   */
  get isChanged(): boolean {
    return this.yaos.some((y) => y.isChanged);
  }

  /**
   * 外卦是否变
   */
  get dynamicOuter(): boolean {
    return this.yaos.slice(3).some((y) => y.isDynamic || y.isChanged);
  }

  /**
   * 内卦是否变
   */
  get dynamicInner(): boolean {
    return this.yaos.slice(0, 3).some((y) => y.isDynamic || y.isChanged);
  }

  constructor(yaos: Yao[]);
  constructor(countsOfYang?: number[]);
  constructor(array: number[] | Yao[] = [1, 1, 1, 1, 1, 1]) {
    if (array.length !== 6) {
      throw new Error('卦象必须由6个爻组成');
    }

    if (array.every((a) => a instanceof Yao)) {
      this.yaos = array.map((a) => a.clone()) as LiuYao;
    } else if (array.every((a) => typeof a === 'number')) {
      this.yaos = array.map((d) => new Yao(d)) as LiuYao;
    } else {
      throw new Error('构造函数参数必须是数字数组或爻对象数组');
    }
  }

  setYao(index: number, countOfYang: number): void {
    this.yaos[index].set(countOfYang);
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
   * 描述此卦叫什么名字、第几爻是动爻，从什么卦变为什么卦
   */
  toDescription(): string {
    const infos: string[] = [`本卦${this.info.id}`];
    const changed = this.toChanged();
    if (changed) {
      infos.push(`变卦${changed.info.id}`);
      infos.push(
        `动爻：${this.yaos
          .map((y, i) => (y.isDynamic ? `${YaoIndex[i]}` : null))
          .filter((s): s is string => s !== null)
          .join('、')}`,
      );
    } else {
      infos.push('无动爻');
    }

    return infos.join('，');
  }
}
