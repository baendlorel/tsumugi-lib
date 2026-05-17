import solar2lunar from 'solarlunar';
import { Hexagram } from './classes/hexagram.js';
import { Yao } from './classes/yao.js';
import { SixGodTable } from './core/six-gods.js';

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

function getShichen(date: Date): string {
  return '子丑丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子'[date.getHours()] ?? '未知';
}

function getLunarInfo() {
  const rawDatetime = process.argv[3];
  const datetime = new Date(rawDatetime);
  if (Number.isNaN(datetime.getTime())) {
    return null;
  }

  const l = solar2lunar.solar2lunar(datetime.getFullYear(), datetime.getMonth() + 1, datetime.getDate());

  if (l === -1) {
    return null;
  }

  const gods = SixGodTable.find((g) => g.heavenlyStem === l.gzDay[0])!.gods;
  return {
    年: l.gzYear,
    月: l.gzMonth,
    日: l.gzDay,
    时: getShichen(datetime),
    六神顺序: {
      上爻: gods[5],
      五爻: gods[4],
      四爻: gods[3],
      三爻: gods[2],
      二爻: gods[1],
      初爻: gods[0],
    },
  };
}

console.dir({ version: 'UPDATED_AT', 卦象: getInfo()?.toAIReadable(), 时辰信息: getLunarInfo() }, { depth: 6 });
