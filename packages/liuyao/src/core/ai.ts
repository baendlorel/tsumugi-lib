import { 爻位, type 六爻卦象 } from '../classes/hexagram.js';
import type { SixGod } from './six-gods.js';

interface YaoInfo {
  爻: string;
  装卦: string;
  关系?: '世' | '应';
  六神?: SixGod;
}

export interface AIReadableInfo {
  本卦: HexagramAIReadable;
  变卦: HexagramAIReadable | '无';
}

export interface HexagramAIReadable {
  初爻: YaoInfo;
  二爻: YaoInfo;
  三爻: YaoInfo;
  四爻: YaoInfo;
  五爻: YaoInfo;
  上爻: YaoInfo;
  卦名: string;
  宫: string;
  变爻?: string[];
  六冲六合: '六合' | '六冲' | '不是';
}

function createYaoInfo(hexagram: 六爻卦象, index: number, gods?: SixGod[]): YaoInfo {
  const a: YaoInfo = {
    爻: hexagram.六爻[index].名称,
    装卦: hexagram.kins[index],
  };

  if (hexagram.host === index) {
    a.关系 = '世';
  } else if (hexagram.guest === index) {
    a.关系 = '应';
  }

  if (gods) {
    a.六神 = gods[index];
  }

  return a;
}

/**
 * This output is meant for AI skills.
 */
export function toAIReadableJSON(hexagram: 六爻卦象, gods?: SixGod[]): AIReadableInfo {
  const changed = hexagram.toChanged();

  return {
    本卦: {
      上爻: createYaoInfo(hexagram, 5, gods),
      五爻: createYaoInfo(hexagram, 4, gods),
      四爻: createYaoInfo(hexagram, 3, gods),
      三爻: createYaoInfo(hexagram, 2, gods),
      二爻: createYaoInfo(hexagram, 1, gods),
      初爻: createYaoInfo(hexagram, 0, gods),
      卦名: hexagram.卦名,
      宫: hexagram.palaceInfo,
      变爻: hexagram.是否为动卦
        ? hexagram.六爻
            .map((y, i) => (y.是否动爻 ? 爻位[i] : null))
            .filter((s): s is '初爻' | '二爻' | '三爻' | '四爻' | '五爻' | '上爻' => s !== null)
        : undefined,
      六冲六合: hexagram.specialType ?? '不是',
    },
    变卦: changed
      ? {
          上爻: createYaoInfo(changed, 5, gods),
          五爻: createYaoInfo(changed, 4, gods),
          四爻: createYaoInfo(changed, 3, gods),
          三爻: createYaoInfo(changed, 2, gods),
          二爻: createYaoInfo(changed, 1, gods),
          初爻: createYaoInfo(changed, 0, gods),
          卦名: changed.卦名,
          宫: changed.palaceInfo,
          六冲六合: changed.specialType ?? '不是',
        }
      : '无',
    // 世应变化: hostGuestChange.join('，'),
  };
}
