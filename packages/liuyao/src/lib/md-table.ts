import type { 六神 } from '../core/six-gods.js';
import type { 六爻卦 } from '../classes/hexagram.js';
import { 爻位 } from '../classes/hexagram.js';
import type { JSON卦象 } from './json.js';
import { toJSON } from './json.js';

/**
 * 排盘习惯是从上爻往初爻读
 */
const 显示顺序 = [...爻位].reverse();

function 卦象说明(标题: string, 卦: JSON卦象): string {
  return `**${标题}**：${卦.卦名} ｜ 宫：${卦.宫} ｜ 六冲六合：${卦.六冲六合}`;
}

/**
 * This output is meant for AI skills.
 *
 * 本卦每一爻都列出来，变卦只列出动爻变化后的装卦，静爻一栏留空。
 */
export function toMarkdown(本卦: 六爻卦, gods?: 六神[]): string {
  const 数据 = toJSON(本卦, gods);
  const 变卦 = 数据.变卦 === '无' ? null : 数据.变卦;
  const 有六神 = gods !== undefined;

  const 表头 = ['爻位', '爻象', ...(有六神 ? ['六神'] : []), '本卦装卦', '世应', ...(变卦 ? ['变卦装卦'] : [])];

  const 行 = 显示顺序.map((位) => {
    const 本 = 数据.本卦[位];
    return [
      位,
      本.爻,
      ...(有六神 ? [本.六神 ?? ''] : []),
      本.装卦,
      本.关系 ?? '',
      ...(变卦 ? [本.是否动爻 ? 变卦[位].装卦 : ''] : []),
    ];
  });

  const 表格 = [表头, 表头.map(() => '---'), ...行].map((r) => `| ${r.join(' | ')} |`).join('\n');

  return [卦象说明('本卦', 数据.本卦), 变卦 ? 卦象说明('变卦', 变卦) : '**变卦**：无', '', 表格].join('\n');
}
