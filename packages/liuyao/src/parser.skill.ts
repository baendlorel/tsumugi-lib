import solar2lunar from 'solarlunar';
import { 六爻卦 } from './classes/hexagram.js';
import { 爻 } from './classes/yao.js';
import { 六神表 } from './core/six-gods.js';
import { toJSON, type JSON输出 } from './lib/json.js';
import { toYAML } from './lib/yaml.js';
import { toMarkdown } from './lib/md-table.js';

const 输出方式表 = ['json', 'pretty-json', 'yaml', 'md'] as const;
type 输出方式 = (typeof 输出方式表)[number];

type 时辰信息 = Record<'年' | '月' | '日' | '时', string>;

interface 输出数据 {
  version: string;
  卦象: JSON输出 | null;
  时辰?: 时辰信息;
}

interface 参数 {
  format: 输出方式;
  positional: string[];
}

function 解析参数(argv: string[]): 参数 {
  const positional: string[] = [];
  let format: 输出方式 = 'json';

  for (const arg of argv) {
    if (!arg.startsWith('--format=')) {
      positional.push(arg);
      continue;
    }

    const value = arg.slice('--format='.length);
    if (!(输出方式表 as readonly string[]).includes(value)) {
      console.error(`未知的输出格式: ${value}，可选值: ${输出方式表.join(', ')}`);
      process.exit(1);
    }
    format = value as 输出方式;
  }

  return { format, positional };
}

function getInfo(rawYaos: string | undefined) {
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

function getLunarInfo(rawDatetime: string | undefined) {
  if (!rawDatetime) {
    return null;
  }

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

function 缩进(text: string, indent = '  '): string {
  return text
    .split('\n')
    .map((line) => (line ? indent + line : line))
    .join('\n');
}

function 时辰行(时辰: 时辰信息 | undefined): string {
  return 时辰 ? `${时辰.年}年 ${时辰.月}月 ${时辰.日}日 ${时辰.时}时` : '未提供，无法排月建日辰';
}

function 格式化(数据: 输出数据, format: 输出方式, 卦: 六爻卦 | null, gods?: Parameters<typeof toYAML>[1]): string {
  switch (format) {
    case 'json':
      return JSON.stringify(数据);
    case 'pretty-json':
      return JSON.stringify(数据, null, 2);
    case 'yaml': {
      const 行 = [`version: ${数据.version}`, `时辰: ${数据.时辰 ? '' : '无'}`];
      if (数据.时辰) {
        行.push(...Object.entries(数据.时辰).map(([k, v]) => `  ${k}: ${v}`));
      }
      行.push(`卦象: ${卦 ? '' : '无'}`);
      if (卦) {
        行.push(缩进(toYAML(卦, gods)));
      }
      return 行.join('\n');
    }
    case 'md': {
      const 行 = [`# 六爻卦象 ${数据.version}`, '', `**占卦时辰**：${时辰行(数据.时辰)}`, ''];
      行.push(卦 ? toMarkdown(卦, gods) : '**卦象**：无法解析');
      return 行.join('\n');
    }
  }
}

function main() {
  const { format, positional } = 解析参数(process.argv.slice(2));
  const h = getInfo(positional[0]);
  const t = getLunarInfo(positional[1]);
  const 数据: 输出数据 = {
    version: '__VERSION__',
    卦象: h ? toJSON(h, t?.gods) : null,
    ...(h && t ? { 时辰: t.时辰 } : {}),
  };

  return 格式化(数据, format, h, t?.gods);
}

console.log(main());
