import solar2lunar from 'solarlunar';
import { 六爻卦 } from './classes/hexagram.js';
import { 爻 } from './classes/yao.js';
import { 六神表 } from './core/six-gods.js';
import { toAIReadableJSON } from './core/ai.js';

function getInfo() {
  const rawYaos = process.argv[2];
  if (!rawYaos) {
    return null;
  }

  // Maybe 001122 or 坤坤震坎坎离

  const yaos = rawYaos.split('').map(爻.从八卦字段创建);
  if (yaos.every((y): y is 爻 => y !== null) && yaos.length >= 6) {
    return new 六爻卦(yaos);
  }

  return 六爻卦.从阳数字符串创建(rawYaos) || 六爻卦.从卦名创建(rawYaos) || 六爻卦.从单拆重交创建(rawYaos);
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

  const gods = 六神表.find((g) => g.天干 === l.gzDay[0])!.六神;
  return {
    时辰: {
      年: l.gzYear,
      月: l.gzMonth,
      日: l.gzDay,
      时: getShichen(datetime),
    },
    gods,
  };
}

function main() {
  const h = getInfo();
  if (!h) {
    return JSON.stringify({ version: '__VERSION__', 卦象: null }, null, 2);
  }
  const t = getLunarInfo();

  return JSON.stringify({ version: '__VERSION__', 卦象: toAIReadableJSON(h, t?.gods), 时辰: t?.时辰 }, null, 2);
}

console.log(main());
