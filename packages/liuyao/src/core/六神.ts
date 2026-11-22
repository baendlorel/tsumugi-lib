export type 六神 = '玄武' | '白虎' | '螣蛇' | '勾陈' | '朱雀' | '青龙';

export interface 六神信息 {
  /**
   * The Heavenly Stem associated with the Six Gods in this order.
   * They are '甲乙丙丁戊己庚辛壬癸' in sequence.
   * Different Heavenly Stems correspond to different orders of Six Gods.
   */
  天干: string;

  /**
   * Six Gods contains '青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'.
   * Different Heavenly Stems correspond to different orders of Six Gods.
   *
   * Six Gods are all auspicious symbols and protectors.
   * - 青龙: Azure Loong, the God in the East worshipped by the Taoists.
   * - 朱雀: Vermilion Bird, its body is covered with eternal fire.
   * - 白虎: White Tiger, as white as snow. If the emperor is not cruel and tyrannical, the White Tiger will appear.
   * - 玄武：Black Tortoise, a spiritual creature formed by the combination of a tortoise and a snake.
   * - 螣蛇: Flying Serpent, a limbless divine serpent that can summon clouds and mist and roam within them.
   * - 勾陈: Gouchen, Also considered as 麒麟 Kylin. It has a body like a musk deer, a tail like that of a dragon, dragon scales, and a single horn.
   */
  六神: 六神[];
}

/**
 * @see 《增删卜易·六神章》
 */
export const 六神表: readonly 六神信息[] = [
  {
    天干: '甲',
    六神: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as 六神[],
  },
  {
    天干: '乙',
    六神: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as 六神[],
  },
  {
    天干: '丙',
    六神: ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'] as 六神[],
  },
  {
    天干: '丁',
    六神: ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'] as 六神[],
  },
  {
    天干: '戊',
    六神: ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'] as 六神[],
  },
  {
    天干: '己',
    六神: ['螣蛇', '白虎', '玄武', '青龙', '朱雀', '勾陈'] as 六神[],
  },
  {
    天干: '庚',
    六神: ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'] as 六神[],
  },
  {
    天干: '辛',
    六神: ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'] as 六神[],
  },
  {
    天干: '壬',
    六神: ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'] as 六神[],
  },
  {
    天干: '癸',
    六神: ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'] as 六神[],
  },
];

Object.freeze(六神表);
