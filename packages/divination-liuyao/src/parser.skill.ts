import { Hexagram } from './classes/hexagram.js';
import { Yao } from './classes/yao.js';

function getInfo() {
  const rawYaos = process.argv[2];
  if (!rawYaos) {
    return null;
  }

  // Maybe 001122 or 坤坤震坎坎离

  const yaos = rawYaos.split('').map(Yao.fromTrigramField);
  if (yaos.every((y): y is Yao => y !== null) && yaos.length >= 6) {
    return new Hexagram(yaos);
  }

  return Hexagram.fromQuaternary(rawYaos) || Hexagram.fromId(rawYaos) || Hexagram.fromSymbolName(rawYaos);
}

console.log(getInfo()?.toAIReadable() || '无法识别输入的卦象');
