import { Hexagram } from '../classes/hexagram.js';
import { Phase, BranchPhase } from './common.js';

export type Kin = '父母' | '子孙' | '妻财' | '官鬼' | '兄弟';

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
 * Returns kins.
 * @param v inner outer extracted from trigram
 * @param phase 金木水火土
 * @param kin 六亲
 */
function map(
  v: BranchPhase,
  phase0: Phase,
  kin0: Kin,
  phase1: Phase,
  kin1: Kin,
  phase2: Phase,
  kin2: Kin,
  phase3: Phase,
  kin3: Kin,
  phase4: Phase,
  kin4: Kin,
): Kin {
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

const _mappers: Record<string, (sp: BranchPhase) => Kin> = {
  乾: (v: BranchPhase) => map(v, '金', '兄弟', '土', '父母', '木', '妻财', '火', '官鬼', '水', '子孙'),
  兑: (v: BranchPhase) => map(v, '金', '兄弟', '土', '父母', '木', '妻财', '火', '官鬼', '水', '子孙'),
  坎: (v: BranchPhase) => map(v, '木', '子孙', '水', '兄弟', '金', '父母', '火', '妻财', '土', '官鬼'),
  坤: (v: BranchPhase) => map(v, '土', '兄弟', '火', '父母', '木', '官鬼', '水', '妻财', '金', '子孙'),
  艮: (v: BranchPhase) => map(v, '土', '兄弟', '火', '父母', '木', '官鬼', '水', '妻财', '金', '子孙'),
  离: (v: BranchPhase) => map(v, '木', '父母', '土', '子孙', '水', '官鬼', '金', '妻财', '火', '兄弟'),
  震: (v: BranchPhase) => map(v, '木', '兄弟', '水', '父母', '金', '官鬼', '火', '子孙', '土', '妻财'),
  巽: (v: BranchPhase) => map(v, '木', '兄弟', '水', '父母', '金', '官鬼', '火', '子孙', '土', '妻财'),
};

/**
 * @see 《增删卜易·六亲歌章》
 */
export function setupSixKins(hexagram: Hexagram): Kin[] {
  const mapper = _mappers[hexagram.palace];
  return [...hexagram.inner.inner.map(mapper), ...hexagram.outer.outer.map(mapper)];
}
