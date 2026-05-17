export type SixGods = '玄武' | '白虎' | '螣蛇' | '勾陈' | '朱雀' | '青龙';

/**
 * @see 增删卜易-六神章
 * 这是从六神章复制+转置得到的，原文是和爻位相同，因此转置后需要reverse才能对应正确的顺序
 */
const SIX_GODS: Array<{ tb: string; gods: SixGods[] }> = [
  { tb: '甲乙', gods: ['玄武', '白虎', '螣蛇', '勾陈', '朱雀', '青龙'].reverse() as SixGods[] },
  { tb: '丙丁', gods: ['青龙', '玄武', '白虎', '螣蛇', '勾陈', '朱雀'].reverse() as SixGods[] },
  { tb: '戊日', gods: ['朱雀', '青龙', '玄武', '白虎', '螣蛇', '勾陈'].reverse() as SixGods[] },
  { tb: '己日', gods: ['勾陈', '朱雀', '青龙', '玄武', '白虎', '螣蛇'].reverse() as SixGods[] },
  { tb: '庚辛', gods: ['螣蛇', '勾陈', '朱雀', '青龙', '玄武', '白虎'].reverse() as SixGods[] },
  { tb: '壬癸', gods: ['白虎', '螣蛇', '勾陈', '朱雀', '青龙', '玄武'].reverse() as SixGods[] },
];

export const getSixGods = (tb: string): SixGods[] => {
  const gods = SIX_GODS.find((sg) => sg.tb.includes(tb))?.gods;
  if (!gods) {
    throw new Error('无法找到对应的六神，请检查输入的地支，' + tb);
  }
  return gods;
};
