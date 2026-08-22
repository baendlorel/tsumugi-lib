import { Hexagram } from '../classes/hexagram.js';
import { Phase, StemPhase } from './common.js';

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
 * @param sp inner outer extracted from trigram
 * @param phase 金木水火土
 * @param kin 六亲
 */
function map(
  sp: StemPhase,
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
  if (sp.includes(phase0)) {
    return kin0;
  }
  if (sp.includes(phase1)) {
    return kin1;
  }
  if (sp.includes(phase2)) {
    return kin2;
  }
  if (sp.includes(phase3)) {
    return kin3;
  }
  if (sp.includes(phase4)) {
    return kin4;
  }
  throw new Error(`No StemPhase[${sp}] matches phase[${phase0},${phase1},${phase2},${phase3},${phase4}]`);
}

const mappers: Record<string, (sp: StemPhase) => Kin> = {
  乾: (v: StemPhase) => map(v, '金', '兄弟', '土', '父母', '木', '妻财', '火', '官鬼', '水', '子孙'),
};

export function setupSinKins(hexagram: Hexagram): Kin[] {
  const mapper = mappers[hexagram.palace];
  return [...hexagram.inner.inner.map(mapper), ...hexagram.outer.outer.map(mapper)];
}
