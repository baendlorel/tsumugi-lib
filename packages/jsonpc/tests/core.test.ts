import { describe, expect, it } from 'vitest';
import { aggregateComments, convertCommentsToProperties, normalizeLines, stripTopBottom } from '../src/core.js';
import { COMMENT_SUFFIX } from '../src/consts.js';

const text = `
// 顶头注释1
// 顶头注释2

{
  // ddd注释1
  // ddd注释2

  "ddd":23
}

// 尾部注释
`;
const lines = normalizeLines(text);

const stripIndex = stripTopBottom(lines);

const bottomComments = lines.splice(stripIndex.bottom);
const topComments = lines.splice(0, stripIndex.top + 1);

// Collect multi // comments
const compressed = aggregateComments(lines);

const named = convertCommentsToProperties(compressed);
const names = [...named.names].map(([k]) => k);

describe('core函数解析流程测试', () => {
  it('到聚合注释为数组为止', () => {
    expect(lines.length).toEqual(5);
    expect(stripIndex.top).toEqual(1);
    expect(stripIndex.bottom).toEqual(7);
    expect(compressed).toEqual(['{', ['// ddd注释1', '// ddd注释2'], `"${names[0]}":23`, '}']);
  });

  it('注释转化为字段', () => {
    expect(
      [...named.names].every(([k]) =>
        k.match(/^ddd_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
      ),
    ).toBe(true);
  });

  it('解析为对象', () => {
    expect(JSON.parse(named.lines.join(''))).toEqual({
      [names[0]]: 23,
      [names[0] + COMMENT_SUFFIX]: ['// ddd注释1', '// ddd注释2'],
    });
  });
});
