import { readFileSync } from 'node:fs';

import solar2lunar from 'solarlunar';
import { 六爻卦 } from './classes/hexagram.js';
import { 六神表 } from './core/six-gods.js';
import { toJSON, type JSON输出 } from './lib/json.js';
import { toYAML } from './lib/yaml.js';
import { toMarkdown } from './lib/md-table.js';
import { 扫描代码块, type 代码块 } from './lib/code-blocks.js';

const 输出方式表 = ['json', 'pretty-json', 'yaml', 'md'] as const;
type 输出方式 = (typeof 输出方式表)[number];

type 时辰信息 = Record<'年' | '月' | '日' | '时', string>;

interface 输出数据 {
  version: string;
  卦象: JSON输出;
  时辰?: 时辰信息;
}

type 参数 =
  | { 模式: 'single'; format: 输出方式; 卦象: 六爻卦; 日期: Date | null }
  | { 模式: 'code-blocks'; 文件路径: string };

const 用法 = `用法:
  node parser.skill.mjs <卦象字符串> [--date=<日期>] [--format=<格式>]
  node parser.skill.mjs --code-blocks=<文件路径>

  <卦象字符串>   必填，由初爻到上爻
    六位阳数       如 112233（0 老阴、1 少阳、2 少阴、3 老阳，0 和 3 为动爻）
    六位单拆重交   如 单单拆拆重重（交单拆重对应阳数 0 1 2 3）
    卦名或全名     如 天风姤、姤、天火
  --date=<日期>   可选，占卜时间，交给 new Date 解析，如 2026-10-31 或 "2026-10-31T13:00"
                 只写日期时 new Date 按 UTC 零点解析，会固定成辰时，请把时间写全
  --format=<格式> 可选，${输出方式表.join(' / ')}，默认 json
  --code-blocks=<文件路径>
                 读取文件里所有 \`\`\`liuyao 代码块，一次输出 JSON 数组，
                 不能与 <卦象字符串>、--date、--format 同时使用`;

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

/** 解析成功返回 Date，失败返回 null（不退出，供 --code-blocks 区分两种行） */
function 尝试解析日期(raw: string): Date | null {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function 解析日期(raw: string, 位置?: string): Date {
  if (!raw) {
    报错('--date 的值为空');
  }

  // new Date 不做任何预处理，纯日期会按 UTC 零点解析
  const date = 尝试解析日期(raw);
  if (!date) {
    报错(`${位置 ?? ''}无法解析日期 "${raw}"，请使用 new Date 能识别的格式，如 2026-10-31 或 "2026-10-31T13:00"`);
  }
  return date;
}

function 尝试解析卦象(arg: string): 六爻卦 | null {
  // 六位的只可能是阳数或单拆重交，先试这两种，其余的按卦名查
  return (
    (arg.length === 6 ? (六爻卦.从阳数字符串创建(arg) ?? 六爻卦.从单拆重交创建(arg)) : null) ?? 六爻卦.从卦名创建(arg)
  );
}

function 解析卦象(arg: string): 六爻卦 {
  const 卦 = 尝试解析卦象(arg);

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

interface 代码块卦象 {
  行号: number;
  卦象: JSON输出;
  时辰?: 时辰信息;
}

interface 代码块输出 {
  文件路径: string;
  卦象: 代码块卦象[];
}

/**
 * 在代码块内部找日期和卦象。目前支持的写法只有两种：
 * 只写卦象字符串，或先写日期字符串再写卦象字符串
 */
function 解析代码块(块: string[], 行号: number, 文件路径: string): 代码块卦象 {
  const 内容 = 块.map((l) => l.trim()).filter(Boolean);
  const 位置 = `${文件路径} 第 ${行号} 行 `;
  const 格式提示 =
    `${位置}\`\`\`liuyao 代码块应只有 1 或 2 行（卦象 / 日期 + 卦象），实际 ${内容.length} 行：\n` +
    内容.map((l) => `    ${l}`).join('\n');

  if (内容.length === 0) {
    报错(`${位置}\`\`\`liuyao 代码块是空的`);
  }
  if (内容.length > 2) {
    报错(格式提示);
  }

  // 两行时第一行是日期。这里必须先判卦象再判日期：new Date('112233') 也能解析出年份
  const 日期文字 = 内容.length === 2 ? 内容[0]! : undefined;
  const 首行是卦象 = 日期文字 !== undefined && 尝试解析卦象(日期文字) !== null;
  const 日期 = 日期文字 === undefined || 首行是卦象 ? undefined : 尝试解析日期(日期文字);

  if (首行是卦象) {
    报错(`${位置}\`\`\`liuyao 代码块有两行时，第一行必须是日期、第二行是卦象，但 "${日期文字}" 是卦象`);
  }
  if (日期文字 !== undefined && !日期) {
    报错(`${位置}\`\`\`liuyao 代码块有两行时，第一行必须是日期、第二行是卦象，但 "${日期文字}" 两样都不是`);
  }

  const 卦象文字 = 内容.at(-1)!;
  const 卦 = 尝试解析卦象(卦象文字);
  if (!卦) {
    报错(`${位置}无法解析卦象 "${卦象文字}"`);
  }

  if (!日期) {
    return { 行号, 卦象: toJSON(卦) };
  }

  const 农历 = getLunarInfo(日期, 位置);
  return { 行号, 卦象: toJSON(卦, 农历.gods), 时辰: 农历.时辰 };
}

function 读取代码块文件(文件路径: string): 代码块输出 {
  let 原文: string;
  try {
    原文 = readFileSync(文件路径, 'utf8');
  } catch (e) {
    报错(`无法读取文件 "${文件路径}"：${(e as Error).message}`);
  }

  let 块列表: 代码块[];
  try {
    块列表 = 扫描代码块(原文, 文件路径);
  } catch (e) {
    报错((e as Error).message);
  }

  return {
    文件路径,
    卦象: 块列表.map((块) => 解析代码块(块.行, 块.行号, 文件路径)),
  };
}

function 解析参数(argv: string[]): 参数 {
  const positional: string[] = [];
  let format: 输出方式 = 'json';
  let 日期: Date | null = null;
  let 文件路径: string | null = null;
  let 用过其他选项 = false;

  for (let i = 0; i < argv.length; ) {
    const arg = argv[i]!;
    if (arg === '--format' || arg.startsWith('--format=')) {
      const { 值, 下一项 } = 拆分选项(argv, i);
      format = 解析格式(值);
      用过其他选项 = true;
      i = 下一项;
    } else if (arg === '--date' || arg.startsWith('--date=')) {
      const { 值, 下一项 } = 拆分选项(argv, i);
      日期 = 解析日期(值);
      用过其他选项 = true;
      i = 下一项;
    } else if (arg === '--code-blocks' || arg.startsWith('--code-blocks=')) {
      const { 值, 下一项 } = 拆分选项(argv, i);
      if (!值) {
        报错('--code-blocks 的值为空');
      }
      文件路径 = 值;
      i = 下一项;
    } else if (arg.startsWith('--')) {
      报错(`未知的选项 "${arg}"`);
    } else {
      positional.push(arg);
      用过其他选项 = true;
      i++;
    }
  }

  if (文件路径 !== null) {
    // --code-blocks 与装单卦的用法互斥
    if (用过其他选项) {
      报错('--code-blocks 不能与 <卦象字符串>、--date、--format 同时使用');
    }
    return { 模式: 'code-blocks', 文件路径 };
  }

  if (positional.length === 0) {
    报错('缺少卦象字符串，或改用 --code-blocks=<文件路径> 读取文件');
  }
  if (positional.length > 1) {
    报错(`多余的参数 "${positional.slice(1).join(' ')}"，日期请用 --date=<日期> 传入`);
  }

  return { 模式: 'single', format, 卦象: 解析卦象(positional[0]!), 日期 };
}

function getShichen(date: Date): string {
  return '子丑丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子'[date.getHours()] ?? '未知';
}

function getLunarInfo(datetime: Date, 位置?: string) {
  const l = solar2lunar.solar2lunar(datetime.getFullYear(), datetime.getMonth() + 1, datetime.getDate());

  if (l === -1) {
    报错(`${位置 ?? ''}日期超出农历换算支持范围（1900–2100）`);
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
  const 参数 = 解析参数(process.argv.slice(2));

  if (参数.模式 === 'code-blocks') {
    return JSON.stringify(读取代码块文件(参数.文件路径), null, 2);
  }

  const { format, 卦象, 日期 } = 参数;
  const 农历 = 日期 ? getLunarInfo(日期) : null;
  const 数据: 输出数据 = {
    version: '__VERSION__',
    卦象: toJSON(卦象, 农历?.gods),
    ...(农历 ? { 时辰: 农历.时辰 } : {}),
  };

  return 格式化(数据, format, 卦象, 农历?.gods);
}

console.log(main());
