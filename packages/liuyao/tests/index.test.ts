import { describe, expect, it } from 'vitest';

import { 六神表, 六爻卦, 爻, 爻位, 八卦表, 六十四卦表 } from '../src/index.js';
import type { 六神 } from '../src/index.js';
import { toJSON } from '../src/lib/json.js';
import { toYAML } from '../src/lib/yaml.js';
import { toMarkdown } from '../src/lib/md-table.js';
import { 扫描代码块 } from '../src/lib/code-blocks.js';

const 六神: 六神[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

describe('爻 static methods', () => {
  it('从阳数字符串创建 maps every digit to its yang count', () => {
    expect(爻.从阳数字符串创建('0')?.阳数).toBe(0);
    expect(爻.从阳数字符串创建('1')?.阳数).toBe(1);
    expect(爻.从阳数字符串创建('2')?.阳数).toBe(2);
    expect(爻.从阳数字符串创建('3')?.阳数).toBe(3);
    expect(爻.从阳数字符串创建('4')).toBeNull();
  });

  it('从单拆重交创建 creates yao instances from ancient symbols', () => {
    expect(爻.从单拆重交创建('交')?.阳数).toBe(0);
    expect(爻.从单拆重交创建('单')?.阳数).toBe(1);
    expect(爻.从单拆重交创建('拆')?.阳数).toBe(2);
    expect(爻.从单拆重交创建('重')?.阳数).toBe(3);
    expect(爻.从单拆重交创建('x')).toBeNull();
  });

  it('从名称创建 creates yao instances from yao names', () => {
    expect(爻.从名称创建('老阴')?.阳数).toBe(0);
    expect(爻.从名称创建('少阳')?.阳数).toBe(1);
    expect(爻.从名称创建('少阴')?.阳数).toBe(2);
    expect(爻.从名称创建('老阳')?.阳数).toBe(3);
    expect(爻.从名称创建('无名')).toBeNull();
  });

  it('从八卦字段创建 creates yao instances from trigram metadata fields', () => {
    expect(爻.从八卦字段创建('乾')?.阳数).toBe(3);
    expect(爻.从八卦字段创建('111')?.阳数).toBe(3);
    expect(爻.从八卦字段创建('☰')?.阳数).toBe(3);
    expect(爻.从八卦字段创建(3)?.阳数).toBe(3);
    expect(爻.从八卦字段创建('invalid')).toBeNull();
  });
});

describe('爻 instance', () => {
  it('exposes name, symbol, yin-yang and motion state', () => {
    expect(new 爻(1).名称).toBe('少阳');
    expect(new 爻(1).符号).toBe('单');
    expect(new 爻(1).阴阳).toBe('阳');
    expect(new 爻(2).阴阳).toBe('阴');
    expect(new 爻(1).动静状态).not.toBe(new 爻(3).动静状态);
  });

  it('变 returns a changed copy for a dynamic yao and itself otherwise', () => {
    const changing = 爻.从阳数字符串创建('3')!;
    expect(changing.变().阳数).toBe(2);
    expect(changing.变()).not.toBe(changing);
    expect(changing.阳数).toBe(3);

    const still = 爻.从阳数字符串创建('1')!;
    expect(still.变()).toBe(still);
  });

  it('rejects invalid yang counts and static 老阴/老阳', () => {
    expect(() => new 爻(4)).toThrow(TypeError);
    expect(() => new 爻(0, 0)).toThrow(TypeError);
  });
});

describe('六爻卦 static methods', () => {
  it('从阳数字符串创建 creates a hexagram from quaternary digits', () => {
    const hexagram = 六爻卦.从阳数字符串创建('112233');

    expect(hexagram?.阳数).toEqual([1, 1, 2, 2, 3, 3]);
    expect(hexagram?.全名).toBe('风泽中孚');
    expect(hexagram?.卦名).toBe('中孚');
  });

  it('从单拆重交创建 creates a hexagram from symbolic yao names', () => {
    expect(六爻卦.从单拆重交创建('单单拆拆重重')?.全名).toBe('风泽中孚');
    expect(六爻卦.从单拆重交创建('甲乙')).toBeNull();
  });

  it('从阳数创建 creates a hexagram from yang-count arrays', () => {
    const hexagram = 六爻卦.从阳数创建([2, 2, 2, 2, 2, 2]);
    expect(hexagram?.全名).toBe('坤为地');
    expect(hexagram?.六冲六合).toBe('六冲');
  });

  it('从阳数创建 returns null for invalid yang-count arrays', () => {
    expect(六爻卦.从阳数创建([0, 1, 2])).toBeNull();
    expect(六爻卦.从阳数创建([0, 1, 2, 3, 4, 0])).toBeNull();
  });

  it('从卦名创建 finds hexagrams by full name, short name and unambiguous prefix', () => {
    expect(六爻卦.从卦名创建('天风姤')?.全名).toBe('天风姤');
    expect(六爻卦.从卦名创建('姤')?.全名).toBe('天风姤');
    expect(六爻卦.从卦名创建('天火')?.全名).toBe('天火同人');
    expect(六爻卦.从卦名创建('不存在')).toBeNull();
  });

  it('从卦名创建 yields a static hexagram, since a name carries no moving yao', () => {
    const hexagram = 六爻卦.从卦名创建('天风姤')!;

    expect(hexagram.阳数).toEqual([2, 1, 1, 1, 1, 1]);
    expect(hexagram.变()).toBe(hexagram);
  });

  it('string factories return null instead of throwing when the length is not 6', () => {
    expect(六爻卦.从阳数字符串创建('')).toBeNull();
    expect(六爻卦.从阳数字符串创建('11223')).toBeNull();
    expect(六爻卦.从阳数字符串创建('1122334')).toBeNull();
    expect(六爻卦.从单拆重交创建('单单拆拆重')).toBeNull();
  });
});

describe('六爻卦 instance', () => {
  const hexagram = 六爻卦.从阳数字符串创建('112233')!;

  it('derives the 0/1 binary representation used by the lookup tables', () => {
    expect(hexagram.二进制表示).toBe('110011');
    expect(六十四卦表.find((h) => h.二进制表示 === hexagram.二进制表示)?.全名).toBe('风泽中孚');
  });

  it('exposes palace, shi/ying positions and description', () => {
    expect(hexagram.宫).toBe('艮');
    expect(hexagram.世爻).toBe(3);
    expect(hexagram.应爻).toBe(0);
    expect(hexagram.宫位信息).toBe('艮宫（土）游魂卦');
  });

  it('installs six kins, heavenly stems and branches from bottom to top', () => {
    expect(hexagram.六亲干支五行).toEqual([
      '父母丁巳火',
      '官鬼丁卯木',
      '兄弟丁丑土',
      '兄弟辛未土',
      '父母辛巳火',
      '官鬼辛卯木',
    ]);
  });

  it('变 returns the changed hexagram only when yao are dynamic', () => {
    expect(hexagram.动静状态).not.toBe(六爻卦.从阳数字符串创建('112122')!.动静状态);
    expect(hexagram.变().全名).toBe('地泽临');
    expect(hexagram.全名).toBe('风泽中孚');

    const still = 六爻卦.从阳数字符串创建('112122')!;
    expect(still.变()).toBe(still);
  });

  it('toPrimitive and toString yield the full name', () => {
    expect(`${hexagram}`).toBe('风泽中孚');
    expect(hexagram.toString()).toBe('风泽中孚');
  });

  it('本卦 points to itself for a 本卦 and to the original for a 变卦', () => {
    expect(hexagram.本卦).toBe(hexagram);

    const 变卦 = hexagram.变();
    expect(变卦.本卦).toBe(hexagram);
  });

  it('克隆 keeps the 本卦 pointer, so a cloned 变卦 keeps the 本卦 six kins', () => {
    const 变卦 = hexagram.变();
    const clone = 变卦.克隆();

    expect(clone).not.toBe(变卦);
    expect(clone.全名).toBe(变卦.全名);
    expect(clone.本卦.全名).toBe('风泽中孚');
    expect(clone.六亲干支五行).toEqual(变卦.六亲干支五行);

    const 本卦克隆 = hexagram.克隆();
    expect(本卦克隆.本卦).toBe(本卦克隆);
  });

  it('变卦 installs six kins by the 本卦 palace even when the palaces differ', () => {
    // 天火同人（离宫）变乾为天（乾宫），六亲要按离宫装
    const 本卦 = 六爻卦.从阳数字符串创建('101111')!;
    const 变卦 = 本卦.变();

    expect(本卦.全名).toBe('天火同人');
    expect(变卦.全名).toBe('乾为天');
    expect(变卦.本卦).toBe(本卦);
    expect(变卦.六亲干支五行).toEqual([
      '官鬼甲子水',
      '父母甲寅木',
      '子孙甲辰土',
      '兄弟壬午火',
      '妻财壬申金',
      '子孙壬戌土',
    ]);
    expect(变卦.克隆().六亲干支五行).toEqual(变卦.六亲干支五行);
  });
});

describe('built-in tables', () => {
  it('exposes every hexagram, trigram and six-god order', () => {
    expect(六十四卦表).toHaveLength(64);
    expect(八卦表).toHaveLength(8);
    expect(六神表).toHaveLength(10);
    expect(六神表.every((g) => g.六神.length === 6)).toBe(true);
  });

  it('exposes the six yao positions from bottom to top', () => {
    expect(爻位).toEqual(['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']);
  });
});

describe('toJSON', () => {
  const hexagram = 六爻卦.从阳数字符串创建('112233')!;

  it('lists all six yao from top to bottom with six gods', () => {
    const json = toJSON(hexagram, 六神);

    expect(Object.keys(json.本卦).slice(0, 6)).toEqual(['上爻', '五爻', '四爻', '三爻', '二爻', '初爻']);
    expect(json.本卦.上爻).toEqual({
      爻: '老阳',
      装卦: '官鬼辛卯木',
      是否动爻: true,
      六神: '玄武',
    });
    expect(json.本卦.四爻.关系).toBe('世');
    expect(json.本卦.初爻.关系).toBe('应');
    expect(json.本卦.初爻.六神).toBe('青龙');
    expect(json.本卦.卦名).toBe('中孚');
    expect(json.本卦.宫).toBe('艮宫（土）游魂卦');
    expect(json.本卦.六冲六合).toBe('不是');
  });

  it('omits the six gods when none are given', () => {
    expect(toJSON(hexagram).本卦.上爻.六神).toBeUndefined();
  });

  it('reports 无 when the hexagram is static', () => {
    const still = 六爻卦.从阳数字符串创建('112122')!;
    expect(toJSON(still, 六神).变卦).toBe('无');
  });
});

describe('toYAML', () => {
  it('renders 本卦 and 变卦 blocks', () => {
    const yaml = toYAML(六爻卦.从阳数字符串创建('112233')!, 六神);

    expect(yaml).toContain('本卦:');
    expect(yaml).toContain('变卦:');
    expect(yaml).toContain('  卦名: 中孚');
    expect(yaml).toContain('  卦名: 临');
    expect(yaml).toContain('    装卦: 官鬼辛卯木');
  });

  it('renders a single block when the hexagram is static', () => {
    const yaml = toYAML(六爻卦.从阳数字符串创建('112122')!);
    expect(yaml.startsWith('本卦:')).toBe(true);
    expect(yaml).not.toContain('变卦:');
  });
});

describe('toMarkdown', () => {
  it('renders a six-row table with the 变卦 column for dynamic hexagrams', () => {
    const md = toMarkdown(六爻卦.从阳数字符串创建('112233')!, 六神);
    const lines = md.split('\n');
    const table = lines.slice(lines.findIndex((l) => l.startsWith('|')));

    expect(table).toHaveLength(8);
    expect(table[0]).toBe('| 爻位 | 爻象 | 六神 | 本卦装卦 | 世应 | 变卦装卦 |');
    expect(table[1]).toBe('| --- | --- | --- | --- | --- | --- |');
    expect(table[2]).toBe('| 上爻 | 老阳 | 玄武 | 官鬼辛卯木 |  | 子孙癸酉金 |');
    expect(table).toContain('| 五爻 | 老阳 | 白虎 | 父母辛巳火 |  | 妻财癸亥水 |');
    expect(table).toContain('| 四爻 | 少阴 | 螣蛇 | 兄弟辛未土 | 世 |  |');
    expect(table).toContain('| 初爻 | 少阳 | 青龙 | 父母丁巳火 | 应 |  |');
    expect(md).toContain('**本卦**：中孚 ｜ 宫：艮宫（土）游魂卦 ｜ 六冲六合：不是');
    expect(md).toContain('**变卦**：临 ｜ 宫：坤宫（土）二世卦 ｜ 六冲六合：不是');
  });

  it('drops the 六神 and 变卦 columns when not applicable', () => {
    const md = toMarkdown(六爻卦.从阳数字符串创建('112122')!);
    expect(md).toContain('| 爻位 | 爻象 | 本卦装卦 | 世应 |');
    expect(md).not.toContain('六神');
    expect(md).not.toContain('变卦装卦');
    expect(md).toContain('**变卦**：无');
  });
});

describe('扫描代码块', () => {
  it('finds every ```liuyao block with its 1-based line number', () => {
    const md = [
      '# 笔记',
      '```liuyao',
      '112233',
      '```',
      '',
      '正文',
      '```liuyao',
      '2026-10-31T13:00',
      '天风姤',
      '```',
    ].join('\n');

    expect(扫描代码块(md)).toEqual([
      { 行号: 2, 行: ['112233'] },
      { 行号: 7, 行: ['2026-10-31T13:00', '天风姤'] },
    ]);
  });

  it('ignores other code blocks and nested ``` inside 正文', () => {
    const md = ['```js', 'console.log(1)', '```', '```liuyao', '单单拆拆重重', '```'].join('\n');

    expect(扫描代码块(md)).toEqual([{ 行号: 4, 行: ['单单拆拆重重'] }]);
  });

  it('returns an empty array when there is no block', () => {
    expect(扫描代码块('# 笔记\n没有任何代码块')).toEqual([]);
    expect(扫描代码块('')).toEqual([]);
  });

  it('throws with the file path and line number when a block is not closed', () => {
    expect(() => 扫描代码块('```liuyao\n112233\n', 'note.md')).toThrow(/note\.md.*第 1 行/);
  });
});
