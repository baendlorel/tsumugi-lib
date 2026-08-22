export type SixGod = '玄武' | '白虎' | '螣蛇' | '勾陈' | '朱雀' | '青龙';

export interface SixGodInfo {
  /**
   * The Heavenly Stem associated with the Six Gods in this order.
   * They are '甲乙丙丁戊己庚辛壬癸' in sequence.
   * Different Heavenly Stems correspond to different orders of Six Gods.
   */
  heavenlyStem: string;

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
  gods: SixGod[];
}

/**
 * @see 《增删卜易·六神章》
 */
export const SixGodTable: readonly SixGodInfo[] = [
  {
    heavenlyStem: '甲',
    gods: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as SixGod[],
  },
  {
    heavenlyStem: '乙',
    gods: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as SixGod[],
  },
  {
    heavenlyStem: '丙',
    gods: ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'] as SixGod[],
  },
  {
    heavenlyStem: '丁',
    gods: ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'] as SixGod[],
  },
  {
    heavenlyStem: '戊',
    gods: ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'] as SixGod[],
  },
  {
    heavenlyStem: '己',
    gods: ['螣蛇', '白虎', '玄武', '青龙', '朱雀', '勾陈'] as SixGod[],
  },
  {
    heavenlyStem: '庚',
    gods: ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'] as SixGod[],
  },
  {
    heavenlyStem: '辛',
    gods: ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'] as SixGod[],
  },
  {
    heavenlyStem: '壬',
    gods: ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'] as SixGod[],
  },
  {
    heavenlyStem: '癸',
    gods: ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'] as SixGod[],
  },
];

Object.freeze(SixGodTable);
