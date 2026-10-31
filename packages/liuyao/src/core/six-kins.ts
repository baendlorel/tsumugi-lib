import { 六爻卦 } from '../classes/hexagram.js';
import { 动静状态 } from '../classes/yao.js';
import { 五行, 地支五行 } from './common.js';

/**
 * 六亲只有五个？
 */
export type 六亲 = '父母' | '子孙' | '妻财' | '官鬼' | '兄弟';

`
六亲歌章
生我者为父母，我生者为子孙，我克者为妻财，克我者为官鬼，比和者为兄弟。
乾兑金兄土父传，木财火鬼水子源。（乾兑两宫，八卦俱属金）
坎宫木子兄属水，金父火财土为鬼。(坎宫属水)
坤艮土兄火为父，木鬼水财金子路。（坤艮两宫，八卦俱属土）
离宫木父土子孙，水鬼金财火弟兄。（离宫属火)
震巽木兄水父母，金鬼火子财是土。（震巽两宫，八卦俱属木）
`;

/**
 * 返回六亲和五行
 * @param v inner outer extracted from trigram
 * @param phase 金木水火土
 * @param kin 六亲
 */
function map(
  v: 地支五行,
  phase0: 五行,
  kin0: 六亲,
  phase1: 五行,
  kin1: 六亲,
  phase2: 五行,
  kin2: 六亲,
  phase3: 五行,
  kin3: 六亲,
  phase4: 五行,
  kin4: 六亲,
): 六亲 {
  if (v.includes(phase0)) {
    return kin0;
  }
  if (v.includes(phase1)) {
    return kin1;
  }
  if (v.includes(phase2)) {
    return kin2;
  }
  if (v.includes(phase3)) {
    return kin3;
  }
  if (v.includes(phase4)) {
    return kin4;
  }
  throw new Error(`No BranchPhase[${v}] matches phase[${phase0},${phase1},${phase2},${phase3},${phase4}]`);
}

const _mappers: Record<string, (sp: 地支五行) => 六亲> = {
  乾: (v: 地支五行) => map(v, '金', '兄弟', '土', '父母', '木', '妻财', '火', '官鬼', '水', '子孙'),
  兑: (v: 地支五行) => map(v, '金', '兄弟', '土', '父母', '木', '妻财', '火', '官鬼', '水', '子孙'),
  坎: (v: 地支五行) => map(v, '木', '子孙', '水', '兄弟', '金', '父母', '火', '妻财', '土', '官鬼'),
  坤: (v: 地支五行) => map(v, '土', '兄弟', '火', '父母', '木', '官鬼', '水', '妻财', '金', '子孙'),
  艮: (v: 地支五行) => map(v, '土', '兄弟', '火', '父母', '木', '官鬼', '水', '妻财', '金', '子孙'),
  离: (v: 地支五行) => map(v, '木', '父母', '土', '子孙', '水', '官鬼', '金', '妻财', '火', '兄弟'),
  震: (v: 地支五行) => map(v, '木', '兄弟', '水', '父母', '金', '官鬼', '火', '子孙', '土', '妻财'),
  巽: (v: 地支五行) => map(v, '木', '兄弟', '水', '父母', '金', '官鬼', '火', '子孙', '土', '妻财'),
};

/**
 * 变卦的六亲会继承本卦的六亲，而不是它自己的
 * @see 《增删卜易·六亲歌章》
 */
export function 装六亲五行(卦: 六爻卦): 六亲[] {
  const mapper = _mappers[卦.本卦.宫];
  return [...卦.内卦.内卦地支五行.map(mapper), ...卦.外卦.外卦地支五行.map(mapper)];
}
