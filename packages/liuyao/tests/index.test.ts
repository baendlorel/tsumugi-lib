import { describe, expect, it } from 'vitest';
import { Hexagram, Yao } from '../src/index.js';

describe('Yao static methods', () => {
  it('getName maps every yang count to its yao name', () => {
    expect(Yao.getName(0)).toBe('老阴');
    expect(Yao.getName(1)).toBe('少阳');
    expect(Yao.getName(2)).toBe('少阴');
    expect(Yao.getName(3)).toBe('老阳');
  });

  it('fromSymbol creates yao instances from ancient symbols', () => {
    expect(Yao.fromSymbol('×')?.yangs).toBe(0);
    expect(Yao.fromSymbol('’')?.yangs).toBe(1);
    expect(Yao.fromSymbol('”')?.yangs).toBe(2);
    expect(Yao.fromSymbol('○')?.yangs).toBe(3);
    expect(Yao.fromSymbol('x')).toBeNull();
  });

  it('fromSymbolName creates yao instances from symbolic names', () => {
    expect(Yao.fromSymbolName('交')?.yangs).toBe(0);
    expect(Yao.fromSymbolName('单')?.yangs).toBe(1);
    expect(Yao.fromSymbolName('拆')?.yangs).toBe(2);
    expect(Yao.fromSymbolName('重')?.yangs).toBe(3);
    expect(Yao.fromSymbolName('甲')).toBeNull();
  });

  it('fromName creates yao instances from yao names', () => {
    expect(Yao.fromName('老阴')?.yangs).toBe(0);
    expect(Yao.fromName('少阳')?.yangs).toBe(1);
    expect(Yao.fromName('少阴')?.yangs).toBe(2);
    expect(Yao.fromName('老阳')?.yangs).toBe(3);
    expect(Yao.fromName('无名')).toBeNull();
  });

  it('fromTrigramField creates yao instances from trigram metadata fields', () => {
    expect(Yao.fromTrigramField('乾')?.yangs).toBe(3);
    expect(Yao.fromTrigramField('111')?.yangs).toBe(3);
    expect(Yao.fromTrigramField('qian')?.yangs).toBe(3);
    expect(Yao.fromTrigramField('天')?.yangs).toBe(3);
    expect(Yao.fromTrigramField('heaven')?.yangs).toBe(3);
    expect(Yao.fromTrigramField('☰')?.yangs).toBe(3);
    expect(Yao.fromTrigramField(3)?.yangs).toBe(3);
    expect(Yao.fromTrigramField('invalid')).toBeNull();
  });
});

describe('Hexagram static methods', () => {
  it('fromBinary creates a hexagram from quaternary digits', () => {
    const hexagram = Hexagram.fromQuaternary('112233');

    expect(hexagram?.yaos.map((yao) => yao.yangs)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(hexagram?.info.id).toBe('风泽中孚');
  });

  it('fromSymbolName creates a hexagram from symbolic yao names', () => {
    const hexagram = Hexagram.fromSymbolName('单单拆拆重重');

    expect(hexagram?.yaos.map((yao) => yao.yangs)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(hexagram?.info.id).toBe('风泽中孚');
  });

  it('fromYangCounts creates a hexagram from yang-count arrays', () => {
    const hexagram = Hexagram.fromYangCounts([2, 2, 2, 2, 2, 2]);
    expect(hexagram?.info.id).toBe('坤为地');
  });

  it('fromYangCounts returns null for invalid yang-count arrays', () => {
    expect(Hexagram.fromYangCounts([0, 1, 2])).toBeNull();
    expect(Hexagram.fromYangCounts([0, 1, 2, 3, 4, 0])).toBeNull();
  });

  it('fromId finds hexagrams by exact id, suffix, and unambiguous prefix', () => {
    expect(Hexagram.fromId('乾为天')?.info.id).toBe('乾为天');
    expect(Hexagram.fromId('天')?.info.id).toBe('乾为天');
    expect(Hexagram.fromId('地雷')?.info.id).toBe('地雷复');
  });

  it('fromId returns null when no matching id exists', () => {
    expect(Hexagram.fromId('不存在')).toBeNull();
    expect(Hexagram.fromId('乾')).toBeNull();
  });

  it('fromPalace finds original palace hexagrams by palace name', () => {
    expect(Hexagram.fromPalace('天')?.info.id).toBe('乾为天');
    expect(Hexagram.fromPalace('地')?.info.id).toBe('坤为地');
  });

  it('fromPalace returns null when the palace name does not exist', () => {
    expect(Hexagram.fromPalace('云')).toBeNull();
  });
});
