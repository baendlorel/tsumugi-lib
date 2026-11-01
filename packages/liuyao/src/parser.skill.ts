import solar2lunar from 'solarlunar';
import { 六爻卦 } from './classes/hexagram.js';
import { 六神表 } from './core/six-gods.js';
import { toJSON, type JSON输出 } from './lib/json.js';
import { toYAML } from './lib/yaml.js';
import { toMarkdown } from './lib/md-table.js';

const 输出方式表 = ['json', 'pretty-json', 'yaml', 'md'] as const;
type 输出方式 = (typeof 输出方式表)[number];

type 时辰信息 = Record<'年' | '月' | '日' | '时', string>;

interface 输出数据 {
  version: string;
  卦象: JSON输出;
  时辰?: 时辰信息;
}

interface 参数 {
  format: 输出方式;
  卦象: 六爻卦;
  日期: Date | null;
}

const 用法 = `用法: node parser.skill.mjs <卦象字符串> [--date=<日期>] [--format=<格式>]

  <卦象字符串>   必填，由初爻到上爻
    六位阳数       如 112233（0 老阴、1 少阳、2 少阴、3 老阳，0 和 3 为动爻）
    六位单拆重交   如 单单拆拆重重（交单拆重对应阳数 0 1 2 3）
    卦名或全名     如 天风姤、姤、天火
  --date=<日期>   可选，占卜时间，交给 new Date 解析，如 2026-10-31 或 "2026-10-31T13:00"
                 只写日期时按 UTC 零点解析，要排准时辰请把时间写全
  --format=<格式> 可选，${输出方式表.join(' / ')}，默认 json`;

function 报错(信息: string): never {
  console.error(`错误：${信息}\n\n${用法}`);
  process.exit(1);
}

/**
 * 兼容 `--date=值` 与 `--date 值` 两种写法；
 * 有些不走 shell 的调用方（如 Windows cmd）会把引号原样传进来，这里一并去掉
 */
function 拆分选项(argv: string[], i: number): { 选项: string; 值: string; 下一项: number } {
  const arg = argv[i]!;
  const eq = arg.indexOf('=');
  if (eq !== -1) {
    return { 选项: arg.slice(0, eq), 值: 去引号(arg.slice(eq + 1)), 下一项: i + 1 };
  }

  const 值 = argv[i + 1];
  if (值 === undefined || 值.startsWith('--')) {
    报错(`${arg} 缺少值，应写成 ${arg}=<值>`);
  }
  return { 选项: arg, 值: 去引号(值), 下一项: i + 2 };
}

function 去引号(value: string): string {
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

function 解析格式(value: string): 输出方式 {
  if (!(输出方式表 as readonly string[]).includes(value)) {
    报错(`未知的输出格式 "${value}"，可选值: ${输出方式表.join(', ')}`);
  }
  return value as 输出方式;
}

function 解析日期(raw: string): Date {
  if (!raw) {
    报错('--date 的值为空');
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    报错(`无法解析日期 "${raw}"，请使用 new Date 能识别的格式，如 2026-10-31 或 "2026-10-31T13:00"`);
  }
  return date;
}

function 解析卦象(arg: string): 六爻卦 {
  // 六位的只可能是阳数或单拆重交，先试这两种，其余的按卦名查
  const 卦 =
    (arg.length === 6 ? (六爻卦.从阳数字符串创建(arg) ?? 六爻卦.从单拆重交创建(arg)) : null) ?? 六爻卦.从卦名创建(arg);

  if (卦) {
    return 卦;
  }

  报错(
    `无法解析卦象 "${arg}"，它不符合任何一种写法：\n` +
      '    六位阳数（0-3，如 112233）\n' +
      '    六位单拆重交（如 单单拆拆重重）\n' +
      '    卦名或全名（如 天风姤、姤、天火）',
  );
}

function 解析参数(argv: string[]): 参数 {
  const positional: string[] = [];
  let format: 输出方式 = 'json';
  let 日期: Date | null = null;

  for (let i = 0; i < argv.length; ) {
    const arg = argv[i]!;
    if (arg === '--format' || arg.startsWith('--format=')) {
      const { 值, 下一项 } = 拆分选项(argv, i);
      format = 解析格式(值);
      i = 下一项;
    } else if (arg === '--date' || arg.startsWith('--date=')) {
      const { 值, 下一项 } = 拆分选项(argv, i);
      日期 = 解析日期(值);
      i = 下一项;
    } else if (arg.startsWith('--')) {
      报错(`未知的选项 "${arg}"`);
    } else {
      positional.push(arg);
      i++;
    }
  }

  if (positional.length === 0) {
    报错('缺少卦象字符串');
  }
  if (positional.length > 1) {
    报错(`多余的参数 "${positional.slice(1).join(' ')}"，日期请用 --date=<日期> 传入`);
  }

  return { format, 卦象: 解析卦象(positional[0]!), 日期 };
}

function getShichen(date: Date): string {
  return '子丑丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子'[date.getHours()] ?? '未知';
}

function getLunarInfo(datetime: Date) {
  const l = solar2lunar.solar2lunar(datetime.getFullYear(), datetime.getMonth() + 1, datetime.getDate());

  if (l === -1) {
    报错('日期超出农历换算支持范围（1900–2100）');
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

function 格式化(数据: 输出数据, format: 输出方式, 卦: 六爻卦, gods?: Parameters<typeof toYAML>[1]): string {
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
      行.push('卦象:');
      行.push(缩进(toYAML(卦, gods)));
      return 行.join('\n');
    }
    case 'md': {
      const 行 = [`# 六爻卦象 ${数据.version}`, '', `**占卦时辰**：${时辰行(数据.时辰)}`, ''];
      行.push(toMarkdown(卦, gods));
      return 行.join('\n');
    }
  }
}

function main() {
  const { format, 卦象, 日期 } = 解析参数(process.argv.slice(2));
  const 农历 = 日期 ? getLunarInfo(日期) : null;
  const 数据: 输出数据 = {
    version: '__VERSION__',
    卦象: toJSON(卦象, 农历?.gods),
    ...(农历 ? { 时辰: 农历.时辰 } : {}),
  };

  return 格式化(数据, format, 卦象, 农历?.gods);
}

console.log(main());
