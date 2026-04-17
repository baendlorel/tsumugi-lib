import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { loadjs } from './setup.js';

const ifCountInBody = (node: { body: Array<{ type: string }> }) => node.body.filter((x) => x.type === 'if').length;

const cond = (text: string) => text.trim();

describe('Zero dependency parser if-tree', () => {
  it('case1', () => {
    const result = parse(loadjs('case1.js'));
    expect(result.length).toBe(1);
    expect(cond(result[0].condition)).toBe('false');
    expect(result[0].elseIfs.length).toBe(0);
    expect(result[0].else).toBeUndefined();
  });

  it('case2', () => {
    const result = parse(loadjs('case2.js'));
    expect(result.length).toBe(1);
    expect(cond(result[0].condition)).toBe('VAL > 10');
    expect(result[0].elseIfs.length).toBe(1);
    expect(cond(result[0].elseIfs[0].condition)).toBe('VAL > 5');
    expect(result[0].else).toBeDefined();
  });

  it('case3', () => {
    const result = parse(loadjs('case3.js'));
    expect(result.length).toBe(0);
  });

  it('case4', () => {
    const result = parse(loadjs('case4.js'));
    expect(result.length).toBe(1);
    expect(cond(result[0].condition)).toBe('DEBUG');
  });

  it('case5', () => {
    const result = parse(loadjs('case5.js'));
    expect(result.length).toBe(2);

    const b = result[0];
    expect(cond(b.condition)).toBe('B');
    expect(ifCountInBody(b)).toBe(2);
    expect(cond(b.body[0].type === 'if' ? b.body[0].condition : '')).toBe('true');
    expect(cond(b.body[1].type === 'if' ? b.body[1].condition : '')).toBe('1');

    const expr = result[1];
    expect(cond(expr.condition)).toBe('2+3');
    expect(ifCountInBody(expr)).toBe(1);
    expect(cond(expr.body[0].type === 'if' ? expr.body[0].condition : '')).toBe('A');
  });

  it('case6', () => {
    const result = parse(loadjs('case6.js'));
    expect(result.length).toBe(2);
    expect(cond(result[0].condition)).toBe('SHOULD_NOT_BE_SEEN');
    expect(cond(result[1].condition)).toBe('A && (B || C)');
    expect(ifCountInBody(result[1])).toBe(1);
    expect(cond(result[1].body[0].type === 'if' ? result[1].body[0].condition : '')).toBe('B');
  });

  it('case7', () => {
    const result = parse(loadjs('case7.js'));
    expect(result.length).toBe(4);
    expect(cond(result[0].condition)).toBe('X');
    expect(cond(result[1].condition)).toBe('0');
    expect(cond(result[2].condition)).toBe('Y');
    expect(ifCountInBody(result[2])).toBe(1);
    expect(cond(result[2].body[0].type === 'if' ? result[2].body[0].condition : '')).toBe('Z');
    expect(cond(result[3].condition)).toBe('-1');
  });

  it('case8', () => {
    const result = parse(loadjs('case8.js'));
    expect(result.length).toBe(2);
    expect(cond(result[0].condition)).toBe('(A && )');
    expect(cond(result[1].condition)).toBe('D');
  });

  it('case9', () => {
    const result = parse(loadjs('case9.js'));
    expect(result.length).toBe(1);
    expect(cond(result[0].condition)).toBe('A');
    expect(result[0].elseIfs.length).toBe(0);
    expect(result[0].else).toBeDefined();
  });

  it('case10', () => {
    const result = parse(loadjs('case10.js'));
    expect(result.length).toBe(2);
    expect(cond(result[0].condition)).toBe('A');
    expect(result[0].elseIfs.length).toBe(2);
    expect(result[0].else).toBeDefined();
    expect(cond(result[1].condition)).toBe('X');
    expect(ifCountInBody(result[1])).toBe(1);
    const innerY = result[1].body[0];
    expect(innerY.type).toBe('if');
    if (innerY.type === 'if') {
      expect(cond(innerY.condition)).toBe('Y');
      expect(innerY.elseIfs.length).toBe(1);
      expect(innerY.else).toBeDefined();
    }
  });

  it('case11', () => {
    const result = parse(loadjs('case11.js'));
    expect(result.length).toBe(2);
    expect(cond(result[0].condition)).toBe('false');
    expect(result[0].elseIfs.length).toBe(4);
    expect(result[0].else).toBeDefined();
    expect(cond(result[1].condition)).toBe('LEVEL1');
    expect(ifCountInBody(result[1])).toBe(1);

    const innerLevel2 = result[1].body[0];
    expect(innerLevel2.type).toBe('if');
    if (innerLevel2.type === 'if') {
      expect(cond(innerLevel2.condition)).toBe('LEVEL2');
      expect(innerLevel2.elseIfs.length).toBe(1);
      expect(innerLevel2.else).toBeDefined();
      expect(ifCountInBody(innerLevel2.elseIfs[0])).toBe(1);
      expect(cond(innerLevel2.elseIfs[0].body[0].type === 'if' ? innerLevel2.elseIfs[0].body[0].condition : '')).toBe(
        'LEVEL3',
      );
    }
  });

  it('case12', () => {
    const result = parse(loadjs('case12.js'));
    expect(result.length).toBe(3);
    expect(cond(result[0].condition)).toBe('A > 10');
    expect(result[0].elseIfs.length).toBe(2);
    expect(result[0].else).toBeDefined();
    expect(cond(result[1].condition)).toBe('X && Y');
    expect(result[1].elseIfs.length).toBe(2);
    expect(result[1].else).toBeDefined();
    expect(cond(result[2].condition)).toBe("TYPE === 'prod'");
    expect(result[2].elseIfs.length).toBe(2);
    expect(result[2].else).toBeDefined();
  });

  it('case13', () => {
    const result = parse(loadjs('case13.js'));
    expect(result.length).toBe(4);
    expect(cond(result[0].condition)).toBe('A');
    expect(cond(result[1].condition)).toBe('B');
    expect(result[1].elseIfs.length).toBe(1);
    expect(cond(result[2].condition)).toBe('D');
    expect(result[2].elseIfs.length).toBe(2);
    expect(result[2].else).toBeDefined();
    expect(cond(result[3].condition)).toBe('L1');
    expect(result[3].elseIfs.length).toBe(1);
    expect(ifCountInBody(result[3])).toBe(1);

    const l2 = result[3].body[0];
    expect(l2.type).toBe('if');
    if (l2.type === 'if') {
      expect(cond(l2.condition)).toBe('L2');
      expect(l2.elseIfs.length).toBe(1);
      expect(ifCountInBody(l2)).toBe(1);

      const l3 = l2.body[0];
      expect(l3.type).toBe('if');
      if (l3.type === 'if') {
        expect(cond(l3.condition)).toBe('L3');
        expect(l3.elseIfs.length).toBe(1);
        expect(ifCountInBody(l3)).toBe(1);

        const l4 = l3.body[0];
        expect(l4.type).toBe('if');
        if (l4.type === 'if') {
          expect(cond(l4.condition)).toBe('L4');
          expect(l4.elseIfs.length).toBe(1);
        }
      }
    }
  });

  it('case14', () => {
    const result = parse(loadjs('case14.js'));
    expect(result.length).toBe(2);
    expect(cond(result[0].condition)).toBe('VAL === 1');
    expect(result[0].elseIfs.length).toBe(4);
    expect(result[0].else).toBeDefined();
    expect(cond(result[1].condition)).toBe('OUTER');
    expect(result[1].elseIfs.length).toBe(1);
    expect(result[1].else).toBeDefined();
    expect(ifCountInBody(result[1])).toBe(2);

    const innerA = result[1].body[0];
    expect(innerA.type).toBe('if');
    if (innerA.type === 'if') {
      expect(cond(innerA.condition)).toBe('INNER_A');
      expect(innerA.elseIfs.length).toBe(2);
      expect(innerA.else).toBeDefined();
    }

    const innerSecond = result[1].body[1];
    expect(innerSecond.type).toBe('if');
    if (innerSecond.type === 'if') {
      expect(cond(innerSecond.condition)).toBe('SECOND_A');
      expect(innerSecond.elseIfs.length).toBe(1);
      expect(innerSecond.else).toBeDefined();
    }
  });

  it('case15', () => {
    expect(() => parse(loadjs('case15.js'))).toThrow(/Must start with #if, got #elseif./);
  });

  it('case16', () => {
    const result = parse(loadjs('case16.js'));
    expect(result.length).toBe(1);
    expect(cond(result[0].condition)).toBe('VALID');
    expect(result[0].elseIfs.length).toBe(1);
    expect(cond(result[0].elseIfs[0].condition)).toBe('(BROKEN &&');
    expect(result[0].else).toBeUndefined();
  });

  it('case17', () => {
    expect(() => parse(loadjs('case17.js'))).toThrow(/Unexpected #else statement found after #else/);
  });
});
