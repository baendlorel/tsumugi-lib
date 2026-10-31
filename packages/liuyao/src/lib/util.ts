import { 六爻卦 } from '../classes/hexagram.js';
import { 爻 } from '../classes/yao.js';
import { toJSON } from '../core/ai.js';

/**
 * Convert 本卦 and 变卦 to AI readable json
 * @param ben 本卦 like 天风姤
 * @param bian 变卦 like 天雷无妄
 * @returns AI readable json
 */
export function resolveHexagram(ben: string, bian: string) {
  const h1 = 六爻卦.从卦名创建(ben);
  const h2 = 六爻卦.从卦名创建(bian);

  if (!h1) {
    throw new Error(`Invalid 本卦: ${ben}`);
  }
  if (!h2) {
    throw new Error(`Invalid 变卦: ${bian}`);
  }

  // Yaos here can only be 0 and 1
  const yaos = h1.六爻.map((y, i) => {
    if (y.阳数 === h2.六爻[i].阳数) {
      return new 爻(y.阳数);
    }

    if (y.阳数 === 2) {
      return new 爻(0);
    }

    if (y.阳数 === 1) {
      return new 爻(3);
    }

    throw new Error(`Invalid 变卦: ${bian}, it is not a valid change from 本卦: ${ben}`);
  });

  return new 六爻卦(yaos);
}

const [, , ben, bian] = process.argv;
if (ben && bian) {
  const gram = resolveHexagram(ben, bian);
  const json = toJSON(gram);
  console.log(JSON.stringify({ yaos: gram.阳数.join(''), ...json }, null, 2));
}
