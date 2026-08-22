/**
 * Kins and their corresponding earthly branches in the Liu Yao divination system, along with the type of relation (世 or 应).
 * This information is crucial for interpreting the hexagrams and their changing lines in the context of a divination reading.
 *
 * @deprecated This is for beginners.
 */
export interface SetupGramInfo {
  /**
   * There are 5 kins in total.
   *
   * - 兄弟 (Brothers): Representing peers, friends, or competitors.
   * - 妻财 (Wife/Wealth): Representing spouse, wealth, or resources.
   * - 子孙 (Children/Descendants): Representing offspring, students, or followers.
   * - 官鬼 (Officials/Ghosts): Representing authority figures, adversaries, or hidden factors.
   * - 父母 (Parents): Representing parents, mentors, or foundational influences.
   *
   * Each kin is associated with one of the twelve earthly branches (地支), which adds another layer of meaning to the hexagram lines.
   */
  kin:
    | '兄弟丑土'
    | '兄弟亥水'
    | '兄弟午火'
    | '兄弟卯木'
    | '兄弟子水'
    | '兄弟寅木'
    | '兄弟巳火'
    | '兄弟戌土'
    | '兄弟未土'
    | '兄弟申金'
    | '兄弟辰土'
    | '兄弟酉金'
    | '妻财丑土'
    | '妻财亥水'
    | '妻财午火'
    | '妻财卯木'
    | '妻财子水'
    | '妻财寅木'
    | '妻财巳火'
    | '妻财戌土'
    | '妻财未土'
    | '妻财申金'
    | '妻财辰土'
    | '妻财酉金'
    | '子孙丑土'
    | '子孙亥水'
    | '子孙午火'
    | '子孙卯木'
    | '子孙子水'
    | '子孙寅木'
    | '子孙巳火'
    | '子孙戌土'
    | '子孙未土'
    | '子孙申金'
    | '子孙辰土'
    | '子孙酉金'
    | '官鬼丑土'
    | '官鬼亥水'
    | '官鬼午火'
    | '官鬼卯木'
    | '官鬼子水'
    | '官鬼寅木'
    | '官鬼巳火'
    | '官鬼戌土'
    | '官鬼未土'
    | '官鬼申金'
    | '官鬼辰土'
    | '官鬼酉金'
    | '父母丑土'
    | '父母亥水'
    | '父母午火'
    | '父母卯木'
    | '父母子水'
    | '父母寅木'
    | '父母巳火'
    | '父母戌土'
    | '父母未土'
    | '父母申金'
    | '父母辰土'
    | '父母酉金';

  /**
   * Host（世）is the augur and Guest（应） is the person or things which to ask about.
   *
   * Indexes of Host and Guest satisfies this formula:
   * ```js
   * index_guest = (index_host + 3) % 6
   * ```
   */
  hostGuest?: '世' | '应';
}

export const enum GramType {
  /** 内卦 */
  Inner,
  /** 外卦 */
  Outer,
}

`
乾在内卦，子水、寅木、辰土；乾在外卦，午火、申金、戌土。
坎在内卦，寅木、辰土、午火；坎在外卦，申金、戌土、子水。
艮在内卦，辰土、午火、申金；艮在外卦，戌土、子水、寅木。
震在内卦，子水、寅木、辰土；震在外卦，午火、申金、戌土。
巽在内卦，丑土、亥水、酉金；巽在外卦，未土、巳火、卯木。
离在内卦，卯木、丑土、亥水；离在外卦，酉金、未土、巳火。
坤在内卦，未土、巳火、卯木；坤在外卦，丑土、亥水、酉金。
兑在内卦，巳火、卯木、丑土，兑在外卦，亥水、酉金、未土。
`;

/**
 * @see 《增删卜易·浑天甲子章》
 */
export function setupStemAndPhase(name: string, type: GramType) {
  switch (name) {
    case '乾':
      return type === GramType.Inner ? ['子水', '寅木', '辰土'] : ['午火', '申金', '戌土'];
    case '坎':
      return type === GramType.Inner ? ['寅木', '辰土', '午火'] : ['申金', '戌土', '子水'];
    case '艮':
      return type === GramType.Inner ? ['辰土', '午火', '申金'] : ['戌土', '子水', '寅木'];
    case '震':
      return type === GramType.Inner ? ['子水', '寅木', '辰土'] : ['午火', '申金', '戌土'];
    case '巽':
      return type === GramType.Inner ? ['丑土', '亥水', '酉金'] : ['未土', '巳火', '卯木'];
    case '离':
      return type === GramType.Inner ? ['卯木', '丑土', '亥水'] : ['酉金', '未土', '巳火'];
    case '坤':
      return type === GramType.Inner ? ['未土', '巳火', '卯木'] : ['丑土', '亥水', '酉金'];
    case '兑':
      return type === GramType.Inner ? ['巳火', '卯木', '丑土'] : ['亥水', '酉金', '未土'];
  }
}
