import type { Hexagram } from '../classes/hexagram.js';
import type { SixGod } from './six-gods.js';

interface YaoInfo {
  爻: string; // 少阴少阳老阴老阳
  类型?: '世' | '应';
  六亲: string; // 例如：父金、兄弟水、妻财木等
}

export interface AIReadableInfo {
  本卦: HexagramAIReadable;
  变卦: HexagramAIReadable | '无';
  世应变化?: string;
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
  六冲六合: '六合卦' | '六冲卦' | '不是';
}

/**
 * This output is meant for AI skills.
 */
export function toAIReadableJSON(hexagram: Hexagram, gods?: SixGod[]) {
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

  const createYaoInfo = (yaos: Yao[], si: SetupGramInfo[], index: number): YaoInfo => {
    const o = { 爻: yaos[index].name, 六亲: si[index].kin, 类型: si[index].hostGuest };
    if (!o.类型) {
      delete o.类型;
    }
    return o;
  };

  return {
    本卦: {
      上爻: createYaoInfo(this.yaos, si, 5),
      五爻: createYaoInfo(this.yaos, si, 4),
      四爻: createYaoInfo(this.yaos, si, 3),
      三爻: createYaoInfo(this.yaos, si, 2),
      二爻: createYaoInfo(this.yaos, si, 1),
      初爻: createYaoInfo(this.yaos, si, 0),
      卦名: this.info.id,
      宫: this.palace,
      变爻: this.isDynamic
        ? this.yaos
            .map((y, i) => (y.isDynamic ? HexagramYaoOrder[i] : null))
            .filter((s): s is '初爻' | '二爻' | '三爻' | '四爻' | '五爻' | '上爻' => s !== null)
        : undefined,
      六冲六合: this.isSixScattering ? '六冲卦' : this.isSixGathering ? '六合卦' : '不是',
    },
    变卦: csi
      ? {
          上爻: createYaoInfo(changed.yaos, csi, 5),
          五爻: createYaoInfo(changed.yaos, csi, 4),
          四爻: createYaoInfo(changed.yaos, csi, 3),
          三爻: createYaoInfo(changed.yaos, csi, 2),
          二爻: createYaoInfo(changed.yaos, csi, 1),
          初爻: createYaoInfo(changed.yaos, csi, 0),
          卦名: changed.info.id,
          宫: changed.palace,
          六冲六合: changed.isSixScattering ? '六冲卦' : changed.isSixGathering ? '六合卦' : '不是',
        }
      : '无',
    // 世应变化: hostGuestChange.join('，'),
  };
}
