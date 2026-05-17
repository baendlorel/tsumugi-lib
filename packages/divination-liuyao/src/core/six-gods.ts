export type SixGod = '玄武' | '白虎' | '螣蛇' | '勾陈' | '朱雀' | '青龙';

/**
 * @see 《增删卜易·六神章》
 */
export const SixGodList: Array<{ tb: string; gods: SixGod[] }> = [
  { tb: '甲乙', gods: ['玄武', '白虎', '螣蛇', '勾陈', '朱雀', '青龙'].reverse() as SixGod[] },
  { tb: '丙丁', gods: ['青龙', '玄武', '白虎', '螣蛇', '勾陈', '朱雀'].reverse() as SixGod[] },
  { tb: '戊日', gods: ['朱雀', '青龙', '玄武', '白虎', '螣蛇', '勾陈'].reverse() as SixGod[] },
  { tb: '己日', gods: ['勾陈', '朱雀', '青龙', '玄武', '白虎', '螣蛇'].reverse() as SixGod[] },
  { tb: '庚辛', gods: ['螣蛇', '勾陈', '朱雀', '青龙', '玄武', '白虎'].reverse() as SixGod[] },
  { tb: '壬癸', gods: ['白虎', '螣蛇', '勾陈', '朱雀', '青龙', '玄武'].reverse() as SixGod[] },
];
