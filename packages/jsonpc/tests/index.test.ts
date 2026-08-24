import { describe, expect, it } from 'vitest';
import { JSONWithPropertyComment } from '../src/index.js';

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
const j = new JSONWithPropertyComment(text);
console.log(j);

describe('', () => {
  it('JSONWithPropertyComment测试', () => {
    expect(5).toEqual(5);
  });
});
