import { describe, expect, it } from 'vitest';
import { compressComments, normalizeLines, stripTopBottom } from '../src/core.js';

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
const compressed = compressComments(lines);

describe('core函数测试', () => {
  it('多函数测试', () => {
    expect(lines.length).toEqual(5);
    expect(stripIndex.top).toEqual(1);
    expect(stripIndex.bottom).toEqual(7);
    expect(compressed).toEqual(['{', ['// ddd注释1', '// ddd注释2'], '"ddd":23', '}']);
  });
});
