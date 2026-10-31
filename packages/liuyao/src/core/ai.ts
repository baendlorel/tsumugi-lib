import type { 六神 } from './six-gods.js';
import type { 六爻卦 } from '../classes/hexagram.js';
import { 动静状态 } from '../classes/yao.js';

class 单爻 {
  爻: string;
  装卦: string;
  关系?: '世' | '应';
  六神?: 六神;
  是否动爻: boolean;
  constructor(卦: 六爻卦, index: number, gods?: 六神[]) {
    this.爻 = 卦.六爻[index].名称;
    this.装卦 = 卦.六亲干支五行[index];
    this.是否动爻 = 卦.六爻[index].动静状态 !== 动静状态.静;

    if (卦.世爻 === index) {
      this.关系 = '世';
    } else if (卦.应爻 === index) {
      this.关系 = '应';
    }

    if (gods) {
      this.六神 = gods[index];
    }
  }
}

export interface JSON输出 {
  本卦: JSON卦象;
  变卦: JSON卦象 | '无';
}

export interface JSON卦象 {
  初爻: 单爻;
  二爻: 单爻;
  三爻: 单爻;
  四爻: 单爻;
  五爻: 单爻;
  上爻: 单爻;
  卦名: string;
  宫: string;
  六冲六合: '六合' | '六冲' | '不是';
}

/**
 * This output is meant for AI skills.
 */
export function toAIReadableJSON(本卦: 六爻卦, gods?: 六神[]): JSON输出 {
  const 变卦 = 本卦.变();

  return {
    本卦: {
      上爻: new 单爻(本卦, 5, gods),
      五爻: new 单爻(本卦, 4, gods),
      四爻: new 单爻(本卦, 3, gods),
      三爻: new 单爻(本卦, 2, gods),
      二爻: new 单爻(本卦, 1, gods),
      初爻: new 单爻(本卦, 0, gods),
      卦名: 本卦.卦名,
      宫: 本卦.宫位信息,
      六冲六合: 本卦.六冲六合 ?? '不是',
    },
    变卦:
      本卦 !== 变卦
        ? {
            上爻: new 单爻(变卦, 5, gods),
            五爻: new 单爻(变卦, 4, gods),
            四爻: new 单爻(变卦, 3, gods),
            三爻: new 单爻(变卦, 2, gods),
            二爻: new 单爻(变卦, 1, gods),
            初爻: new 单爻(变卦, 0, gods),
            卦名: 变卦.卦名,
            宫: 变卦.宫位信息,
            六冲六合: 变卦.六冲六合 ?? '不是',
          }
        : '无',
  };
}
