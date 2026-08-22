export const PalaceOrderTable = ['本宫卦', '一世卦', '二世卦', '三世卦', '四世卦', '五世卦', '游魂卦', '归魂卦'];

export type BranchPhase =
  | '子水'
  | '寅木'
  | '辰土'
  | '午火'
  | '申金'
  | '戌土'
  | '寅木'
  | '辰土'
  | '午火'
  | '申金'
  | '戌土'
  | '子水'
  | '辰土'
  | '午火'
  | '申金'
  | '戌土'
  | '子水'
  | '寅木'
  | '子水'
  | '寅木'
  | '辰土'
  | '午火'
  | '申金'
  | '戌土'
  | '丑土'
  | '亥水'
  | '酉金'
  | '未土'
  | '巳火'
  | '卯木'
  | '卯木'
  | '丑土'
  | '亥水'
  | '酉金'
  | '未土'
  | '巳火'
  | '未土'
  | '巳火'
  | '卯木'
  | '丑土'
  | '亥水'
  | '酉金'
  | '巳火'
  | '卯木'
  | '丑土'
  | '亥水'
  | '酉金'
  | '未土';

export type Phase = '金' | '木' | '水' | '火' | '土';

export type HeavenStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

export interface HexagramInfo {
  /**
   * Binary representation of the hexagram, where 0 image a yin line and 1 image a yang line. The lines are ordered from the bottom (first line) to the top (sixth line).
   */
  binary: string;

  /**
   * Binary to yangs.
   * e.g. `'000000'` 坤为地 -> `[2, 2, 2, 2, 2, 2]`, 2 means Shao Yin.
   */
  yangs: number[];

  /**
   * Full name of the hexagram, which includes the names of the upper and lower trigrams.
   *
   * For example, "坤为地", "地雷复", "地水师", etc.
   */
  id: string;

  /**
   * Name of the hexagram.
   *
   * For example, "地", "复", "师", etc.
   */
  name: string;

  /**
   * 64 hexagrams correspond to Unicode characters.
   * For example, "䷁" (U+4DC1) image the hexagram "坤为地".
   */
  sign: string;

  /**
   * Five Phases (五行) associated with the hexagram, which can be one of "金" (Metal), "木" (Wood), "水" (Water), "火" (Fire), or "土" (Earth).
   * It indicates the development and state of things.
   */
  phase: Phase;

  /**
   * Eight Palaces (八宫) to which the hexagram belongs.
   * 'Palace' is not a physical palace, but rather a category or family of hexagrams.
   */
  palace: TrigramName;

  /**
   * Index of the hexagram within its palace, ranging from 0 to 7. This index helps to identify the specific hexagram within the context of its palace.
   *
   * - 本宫卦 Original Palace
   * - 一世卦 First Generation, 1st yao is changed
   * - 二世卦 Second Generation, 1st and 2nd yao is changed
   * - 三世卦 Third Generation, 1st, 2nd and 3rd yao is changed
   * - 四世卦 Fourth Generation, 1st, 2nd, 3rd and 4th yao is changed
   * - 五世卦 Fifth Generation, 1st, 2nd, 3rd, 4th and 5th yao is changed
   * - 游魂卦 Wandering Soul, restores 4th yao of Fifth Generation
   * - 归魂卦 Returning Soul, restores lower 3 yaos of Fifth Generation
   */
  generation: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export const HexagramInfoTable: readonly HexagramInfo[] = [
  {
    binary: '000000',
    id: '坤为地',
    sign: '䷁',
    phase: '土',
    palace: '坤',
    generation: 0,
    yangs: [2, 2, 2, 2, 2, 2],
    name: '地',
  },
  {
    binary: '100000',
    id: '地雷复',
    sign: '䷗',
    phase: '土',
    palace: '坤',
    generation: 1,
    yangs: [1, 2, 2, 2, 2, 2],
    name: '复',
  },
  {
    binary: '010000',
    id: '地水师',
    sign: '䷆',
    phase: '水',
    palace: '坎',
    generation: 7,
    yangs: [2, 1, 2, 2, 2, 2],
    name: '师',
  },
  {
    binary: '110000',
    id: '地泽临',
    sign: '䷒',
    phase: '土',
    palace: '坤',
    generation: 2,
    yangs: [1, 1, 2, 2, 2, 2],
    name: '临',
  },
  {
    binary: '001000',
    id: '地山谦',
    sign: '䷎',
    phase: '土',
    palace: '兑',
    generation: 5,
    yangs: [2, 2, 1, 2, 2, 2],
    name: '谦',
  },
  {
    binary: '101000',
    id: '地火明夷',
    sign: '䷣',
    phase: '水',
    palace: '坎',
    generation: 6,
    yangs: [1, 2, 1, 2, 2, 2],
    name: '明夷',
  },
  {
    binary: '011000',
    id: '地风升',
    sign: '䷭',
    phase: '木',
    palace: '震',
    generation: 4,
    yangs: [2, 1, 1, 2, 2, 2],
    name: '升',
  },
  {
    binary: '111000',
    id: '地天泰',
    sign: '䷊',
    phase: '土',
    palace: '坤',
    generation: 3,
    yangs: [1, 1, 1, 2, 2, 2],
    name: '泰',
  },
  {
    binary: '000100',
    id: '雷地豫',
    sign: '䷏',
    phase: '木',
    palace: '震',
    generation: 1,
    yangs: [2, 2, 2, 1, 2, 2],
    name: '豫',
  },
  {
    binary: '100100',
    id: '震为雷',
    sign: '䷲',
    phase: '木',
    palace: '震',
    generation: 0,
    yangs: [1, 2, 2, 1, 2, 2],
    name: '雷',
  },
  {
    binary: '010100',
    id: '雷水解',
    sign: '䷧',
    phase: '木',
    palace: '震',
    generation: 2,
    yangs: [2, 1, 2, 1, 2, 2],
    name: '解',
  },
  {
    binary: '110100',
    id: '雷泽归妹',
    sign: '䷵',
    phase: '金',
    palace: '兑',
    generation: 7,
    yangs: [1, 1, 2, 1, 2, 2],
    name: '归妹',
  },
  {
    binary: '001100',
    id: '雷山小过',
    sign: '䷽',
    phase: '金',
    palace: '兑',
    generation: 6,
    yangs: [2, 2, 1, 1, 2, 2],
    name: '小过',
  },
  {
    binary: '101100',
    id: '雷火丰',
    sign: '䷶',
    phase: '水',
    palace: '坎',
    generation: 5,
    yangs: [1, 2, 1, 1, 2, 2],
    name: '丰',
  },
  {
    binary: '011100',
    id: '雷风恒',
    sign: '䷟',
    phase: '木',
    palace: '震',
    generation: 3,
    yangs: [2, 1, 1, 1, 2, 2],
    name: '恒',
  },
  {
    binary: '111100',
    id: '雷天大壮',
    sign: '䷡',
    phase: '土',
    palace: '坤',
    generation: 4,
    yangs: [1, 1, 1, 1, 2, 2],
    name: '大壮',
  },
  {
    binary: '000010',
    id: '水地比',
    sign: '䷇',
    phase: '土',
    palace: '坤',
    generation: 7,
    yangs: [2, 2, 2, 2, 1, 2],
    name: '比',
  },
  {
    binary: '100010',
    id: '水雷屯',
    sign: '䷂',
    phase: '水',
    palace: '坎',
    generation: 2,
    yangs: [1, 2, 2, 2, 1, 2],
    name: '屯',
  },
  {
    binary: '010010',
    id: '坎为水',
    sign: '䷜',
    phase: '水',
    palace: '坎',
    generation: 0,
    yangs: [2, 1, 2, 2, 1, 2],
    name: '水',
  },
  {
    binary: '110010',
    id: '水泽节',
    sign: '䷻',
    phase: '水',
    palace: '坎',
    generation: 1,
    yangs: [1, 1, 2, 2, 1, 2],
    name: '节',
  },
  {
    binary: '001010',
    id: '水山蹇',
    sign: '䷦',
    phase: '金',
    palace: '兑',
    generation: 4,
    yangs: [2, 2, 1, 2, 1, 2],
    name: '蹇',
  },
  {
    binary: '101010',
    id: '水火既济',
    sign: '䷾',
    phase: '水',
    palace: '坎',
    generation: 3,
    yangs: [1, 2, 1, 2, 1, 2],
    name: '既济',
  },
  {
    binary: '011010',
    id: '水风井',
    sign: '䷯',
    phase: '木',
    palace: '震',
    generation: 5,
    yangs: [2, 1, 1, 2, 1, 2],
    name: '井',
  },
  {
    binary: '111010',
    id: '水天需',
    sign: '䷄',
    phase: '土',
    palace: '坤',
    generation: 6,
    yangs: [1, 1, 1, 2, 1, 2],
    name: '需',
  },
  {
    binary: '000110',
    id: '泽地萃',
    sign: '䷬',
    phase: '金',
    palace: '兑',
    generation: 2,
    yangs: [2, 2, 2, 1, 1, 2],
    name: '萃',
  },
  {
    binary: '100110',
    id: '泽雷随',
    sign: '䷐',
    phase: '木',
    palace: '震',
    generation: 7,
    yangs: [1, 2, 2, 1, 1, 2],
    name: '随',
  },
  {
    binary: '010110',
    id: '泽水困',
    sign: '䷮',
    phase: '金',
    palace: '兑',
    generation: 1,
    yangs: [2, 1, 2, 1, 1, 2],
    name: '困',
  },
  {
    binary: '110110',
    id: '兑为泽',
    sign: '䷹',
    phase: '金',
    palace: '兑',
    generation: 0,
    yangs: [1, 1, 2, 1, 1, 2],
    name: '泽',
  },
  {
    binary: '001110',
    id: '泽山咸',
    sign: '䷞',
    phase: '金',
    palace: '兑',
    generation: 3,
    yangs: [2, 2, 1, 1, 1, 2],
    name: '咸',
  },
  {
    binary: '101110',
    id: '泽火革',
    sign: '䷰',
    phase: '水',
    palace: '坎',
    generation: 4,
    yangs: [1, 2, 1, 1, 1, 2],
    name: '革',
  },
  {
    binary: '011110',
    id: '泽风大过',
    sign: '䷛',
    phase: '木',
    palace: '震',
    generation: 6,
    yangs: [2, 1, 1, 1, 1, 2],
    name: '大过',
  },
  {
    binary: '111110',
    id: '泽天夬',
    sign: '䷪',
    phase: '土',
    palace: '坤',
    generation: 5,
    yangs: [1, 1, 1, 1, 1, 2],
    name: '夬',
  },
  {
    binary: '000001',
    id: '山地剥',
    sign: '䷖',
    phase: '金',
    palace: '乾',
    generation: 5,
    yangs: [2, 2, 2, 2, 2, 1],
    name: '剥',
  },
  {
    binary: '100001',
    id: '山雷颐',
    sign: '䷚',
    phase: '木',
    palace: '巽',
    generation: 6,
    yangs: [1, 2, 2, 2, 2, 1],
    name: '颐',
  },
  {
    binary: '010001',
    id: '山水蒙',
    sign: '䷃',
    phase: '火',
    palace: '离',
    generation: 4,
    yangs: [2, 1, 2, 2, 2, 1],
    name: '蒙',
  },
  {
    binary: '110001',
    id: '山泽损',
    sign: '䷨',
    phase: '土',
    palace: '艮',
    generation: 3,
    yangs: [1, 1, 2, 2, 2, 1],
    name: '损',
  },
  {
    binary: '001001',
    id: '艮为山',
    sign: '䷳',
    phase: '土',
    palace: '艮',
    generation: 0,
    yangs: [2, 2, 1, 2, 2, 1],
    name: '山',
  },
  {
    binary: '101001',
    id: '山火贲',
    sign: '䷕',
    phase: '土',
    palace: '艮',
    generation: 1,
    yangs: [1, 2, 1, 2, 2, 1],
    name: '贲',
  },
  {
    binary: '011001',
    id: '山风蛊',
    sign: '䷑',
    phase: '木',
    palace: '巽',
    generation: 7,
    yangs: [2, 1, 1, 2, 2, 1],
    name: '蛊',
  },
  {
    binary: '111001',
    id: '山天大畜',
    sign: '䷙',
    phase: '土',
    palace: '艮',
    generation: 2,
    yangs: [1, 1, 1, 2, 2, 1],
    name: '大畜',
  },
  {
    binary: '000101',
    id: '火地晋',
    sign: '䷢',
    phase: '金',
    palace: '乾',
    generation: 6,
    yangs: [2, 2, 2, 1, 2, 1],
    name: '晋',
  },
  {
    binary: '100101',
    id: '火雷噬嗑',
    sign: '䷔',
    phase: '木',
    palace: '巽',
    generation: 5,
    yangs: [1, 2, 2, 1, 2, 1],
    name: '噬嗑',
  },
  {
    binary: '010101',
    id: '火水未济',
    sign: '䷿',
    phase: '火',
    palace: '离',
    generation: 3,
    yangs: [2, 1, 2, 1, 2, 1],
    name: '未济',
  },
  {
    binary: '110101',
    id: '火泽睽',
    sign: '䷥',
    phase: '土',
    palace: '艮',
    generation: 4,
    yangs: [1, 1, 2, 1, 2, 1],
    name: '睽',
  },
  {
    binary: '001101',
    id: '火山旅',
    sign: '䷷',
    phase: '火',
    palace: '离',
    generation: 1,
    yangs: [2, 2, 1, 1, 2, 1],
    name: '旅',
  },
  {
    binary: '101101',
    id: '离为火',
    sign: '䷝',
    phase: '火',
    palace: '离',
    generation: 0,
    yangs: [1, 2, 1, 1, 2, 1],
    name: '火',
  },
  {
    binary: '011101',
    id: '火风鼎',
    sign: '䷱',
    phase: '火',
    palace: '离',
    generation: 2,
    yangs: [2, 1, 1, 1, 2, 1],
    name: '鼎',
  },
  {
    binary: '111101',
    id: '火天大有',
    sign: '䷍',
    phase: '金',
    palace: '乾',
    generation: 7,
    yangs: [1, 1, 1, 1, 2, 1],
    name: '大有',
  },
  {
    binary: '000011',
    id: '风地观',
    sign: '䷓',
    phase: '金',
    palace: '乾',
    generation: 4,
    yangs: [2, 2, 2, 2, 1, 1],
    name: '观',
  },
  {
    binary: '100011',
    id: '风雷益',
    sign: '䷩',
    phase: '木',
    palace: '巽',
    generation: 3,
    yangs: [1, 2, 2, 2, 1, 1],
    name: '益',
  },
  {
    binary: '010011',
    id: '风水涣',
    sign: '䷺',
    phase: '火',
    palace: '离',
    generation: 5,
    yangs: [2, 1, 2, 2, 1, 1],
    name: '涣',
  },
  {
    binary: '110011',
    id: '风泽中孚',
    sign: '䷼',
    phase: '土',
    palace: '艮',
    generation: 6,
    yangs: [1, 1, 2, 2, 1, 1],
    name: '中孚',
  },
  {
    binary: '001011',
    id: '风山渐',
    sign: '䷴',
    phase: '土',
    palace: '艮',
    generation: 7,
    yangs: [2, 2, 1, 2, 1, 1],
    name: '渐',
  },
  {
    binary: '101011',
    id: '风火家人',
    sign: '䷤',
    phase: '木',
    palace: '巽',
    generation: 2,
    yangs: [1, 2, 1, 2, 1, 1],
    name: '家人',
  },
  {
    binary: '011011',
    id: '巽为风',
    sign: '䷸',
    phase: '木',
    palace: '巽',
    generation: 0,
    yangs: [2, 1, 1, 2, 1, 1],
    name: '风',
  },
  {
    binary: '111011',
    id: '风天小畜',
    sign: '䷈',
    phase: '木',
    palace: '巽',
    generation: 1,
    yangs: [1, 1, 1, 2, 1, 1],
    name: '小畜',
  },
  {
    binary: '000111',
    id: '天地否',
    sign: '䷋',
    phase: '金',
    palace: '乾',
    generation: 3,
    yangs: [2, 2, 2, 1, 1, 1],
    name: '否',
  },
  {
    binary: '100111',
    id: '天雷无妄',
    sign: '䷘',
    phase: '木',
    palace: '巽',
    generation: 4,
    yangs: [1, 2, 2, 1, 1, 1],
    name: '无妄',
  },
  {
    binary: '010111',
    id: '天水讼',
    sign: '䷅',
    phase: '火',
    palace: '离',
    generation: 6,
    yangs: [2, 1, 2, 1, 1, 1],
    name: '讼',
  },
  {
    binary: '110111',
    id: '天泽履',
    sign: '䷉',
    phase: '土',
    palace: '艮',
    generation: 5,
    yangs: [1, 1, 2, 1, 1, 1],
    name: '履',
  },
  {
    binary: '001111',
    id: '天山遁',
    sign: '䷠',
    phase: '金',
    palace: '乾',
    generation: 2,
    yangs: [2, 2, 1, 1, 1, 1],
    name: '遁',
  },
  {
    binary: '101111',
    id: '天火同人',
    sign: '䷌',
    phase: '火',
    palace: '离',
    generation: 7,
    yangs: [1, 2, 1, 1, 1, 1],
    name: '同人',
  },
  {
    binary: '011111',
    id: '天风姤',
    sign: '䷫',
    phase: '金',
    palace: '乾',
    generation: 1,
    yangs: [2, 1, 1, 1, 1, 1],
    name: '姤',
  },
  {
    binary: '111111',
    id: '乾为天',
    sign: '䷀',
    phase: '金',
    palace: '乾',
    generation: 0,
    yangs: [1, 1, 1, 1, 1, 1],
    name: '天',
  },
];

export interface TrigramInfo {
  /**
   * Presents the trigram as a 3-digit binary string. 1 image a Yang line and 0 image a Yin line.
   *
   * For example, "111" for 乾, "100" for 震, etc.
   */
  binary: `${0 | 1}${0 | 1}${0 | 1}`;

  /**
   * How many Yang Yaos are in the trigram, such as 0 for 坤, 1 for 震, 2 for 兑, etc.
   */
  yangs: 0 | 1 | 2 | 3;

  /**
   * Name of the trigram in Chinese, such as "乾", "坤", "震", etc.
   */
  id: string;

  /**
   * "象", means what the trigram represents in Chinese, such as "天", "地", "水", etc.
   */
  image: string;

  /**
   * Unicode character representing the trigram, such as "☰" for 乾, "☷" for 坤, etc.
   */
  sign: string;

  /**
   * Earth Stem and Five Phases when this gram performs a inner gram of a hexagram.
   * @see 《增删卜易·浑天甲子章》
   */
  inner: BranchPhase[];

  /**
   * Earth Stem and Five Phases when this gram performs a outer gram of a hexagram.
   * @see 《增删卜易·浑天甲子章》
   */
  outer: BranchPhase[];
}

/**
 * List of all trigrams in the I Ching, with their binary representation, number of yang lines, name, what they represent, and their corresponding sign.
 */
export const TrigramInfoTable: readonly TrigramInfo[] = [
  {
    id: '坤',
    binary: '000',
    yangs: 0,
    image: '地',
    sign: '☷',
    inner: ['未土', '巳火', '卯木'],
    outer: ['丑土', '亥水', '酉金'],
  },
  {
    id: '震',
    binary: '100',
    yangs: 1,
    image: '雷',
    sign: '☳',
    inner: ['子水', '寅木', '辰土'],
    outer: ['午火', '申金', '戌土'],
  },
  {
    id: '坎',
    binary: '010',
    yangs: 1,
    image: '水',
    sign: '☵',
    inner: ['寅木', '辰土', '午火'],
    outer: ['申金', '戌土', '子水'],
  },
  {
    id: '兑',
    binary: '110',
    yangs: 2,
    image: '泽',
    sign: '☱',
    inner: ['巳火', '卯木', '丑土'],
    outer: ['亥水', '酉金', '未土'],
  },
  {
    id: '艮',
    binary: '001',
    yangs: 1,
    image: '山',
    sign: '☶',
    inner: ['辰土', '午火', '申金'],
    outer: ['戌土', '子水', '寅木'],
  },
  {
    id: '离',
    binary: '101',
    yangs: 2,
    image: '火',
    sign: '☲',
    inner: ['卯木', '丑土', '亥水'],
    outer: ['酉金', '未土', '巳火'],
  },
  {
    id: '巽',
    binary: '011',
    yangs: 2,
    image: '风',
    sign: '☴',
    inner: ['丑土', '亥水', '酉金'],
    outer: ['未土', '巳火', '卯木'],
  },
  {
    id: '乾',
    binary: '111',
    yangs: 3,
    image: '天',
    sign: '☰',
    inner: ['子水', '寅木', '辰土'],
    outer: ['午火', '申金', '戌土'],
  },
];

Object.freeze(PalaceOrderTable);
Object.freeze(HexagramInfoTable);
Object.freeze(TrigramInfoTable);
