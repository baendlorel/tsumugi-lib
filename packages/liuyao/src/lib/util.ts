import { Hexagram, type AIReadableInfo } from '../classes/hexagram.js';
import { Yao } from '../classes/yao.js';

/**
 * Convert 本卦 and 变卦 to AI readable json
 * @param ben 本卦 like 天风姤
 * @param bian 变卦 like 天雷无妄
 * @returns AI readable json
 */
export function resolveHexagram(ben: string, bian: string): AIReadableInfo {
  const h1 = Hexagram.fromId(ben);
  const h2 = Hexagram.fromId(bian);

  if (!h1) {
    throw new Error(`Invalid 本卦: ${ben}`);
  }
  if (!h2) {
    throw new Error(`Invalid 变卦: ${bian}`);
  }

  // Yaos here can only be 0 and 1
  const yaos = h1.yaos.map((y, i) => {
    if (y.yangs === h2.yaos[i].yangs) {
      return new Yao(y.yangs);
    }

    if (y.yangs === 2) {
      return new Yao(0);
    }

    if (y.yangs === 1) {
      return new Yao(3);
    }

    throw new Error(`Invalid 变卦: ${bian}, it is not a valid change from 本卦: ${ben}`);
  });

  return new Hexagram(yaos).toAIReadable();
}

const [, , ben, bian] = process.argv;
if (ben && bian) {
  console.log(JSON.stringify(resolveHexagram(ben, bian), null, 2));
}
