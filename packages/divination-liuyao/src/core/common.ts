import type { SetupGramInfo } from './setup-gram.js';

/*
䷁,䷖,䷇,䷓,䷏,䷢,䷬,䷋,
坤,剥,比,观,豫,晋,萃,否,

䷎,䷳,䷦,䷴,䷽,䷷,䷞,䷠,
谦,艮,蹇,渐,小过,旅,咸,遁,

䷆,䷃,䷜,䷺,䷧,䷿,䷮,䷅,
师,蒙,坎,涣,解,未济,困,讼,

䷭,䷑,䷯,䷸,䷟,䷱,䷛,䷫,
升,蛊,井,巽,恒,鼎,大过,姤,

䷗,䷚,䷂,䷩,䷲,䷔,䷐,䷘,
复,颐,屯,益,震,噬嗑,随,无妄,

䷣,䷕,䷾,䷤,䷶,䷝,䷰,䷌,
明夷,贲,既济,家人,丰,离,革,同人,

䷒,䷨,䷻,䷼,䷵,䷥,䷹,䷉,
临,损,节,中孚,归妹,睽,兑,履,

䷊,䷙,䷄,䷈,䷡,䷍,䷪,䷀,
泰,大畜,需,小畜,大壮,大有,夬,乾
*/

interface PalaceOrderName {
  name: string;
  nameEn: string;
}

export const PalaceOrderTable: PalaceOrderName[] = [
  { name: '本宫卦', nameEn: 'Original Palace' },
  { name: '一世卦', nameEn: 'First Generation' },
  { name: '二世卦', nameEn: 'Second Generation' },
  { name: '三世卦', nameEn: 'Third Generation' },
  { name: '四世卦', nameEn: 'Fourth Generation' },
  { name: '五世卦', nameEn: 'Fifth Generation' },
  { name: '游魂卦', nameEn: 'Wandering Soul' },
  { name: '归魂卦', nameEn: 'Returning Soul' },
];

export interface HexagramInfo {
  /**
   * Binary representation of the hexagram, where 0 represents a yin line and 1 represents a yang line. The lines are ordered from the bottom (first line) to the top (sixth line).
   */
  binary: `${0 | 1}${0 | 1}${0 | 1}${0 | 1}${0 | 1}${0 | 1}`;

  /**
   * Binary to YangCounts.
   * e.g. `'000000'` 坤为地 -> `[2, 2, 2, 2, 2, 2]`, 2 means Shao Yin.
   */
  yangCounts: number[];

  /**
   * Name of the hexagram, which includes the names of the upper and lower trigrams.
   *
   * For example, "坤为地", "地雷复", "地水师", etc.
   */
  id: string;

  /**
   * 64 hexagrams correspond to Unicode characters.
   * For example, "䷁" (U+4DC1) represents the hexagram "坤为地".
   */
  sign: string;

  /**
   * Five Phases (五行) associated with the hexagram, which can be one of "金" (Metal), "木" (Wood), "水" (Water), "火" (Fire), or "土" (Earth).
   * It indicates the development and state of things.
   */
  phase: '金' | '木' | '水' | '火' | '土';

  /**
   * Eight Palaces (八宫) to which the hexagram belongs.
   * 'Palace' is not a physical palace, but rather a category or family of hexagrams.
   */
  palace: '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

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
  palaceIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

  /**
   * Setup information of the hexagram. Includes Host-Guest（世应） and Six Kins (六亲) for each of the six lines. This information is crucial for interpreting the hexagrams and their changing lines in the context of a divination reading.
   *
   * Host（世）is the augur and Guest（应） is the person or things which to ask about.
   */
  setupInfo: [SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo];
}

export const HexagramInfoTable: readonly HexagramInfo[] = Object.freeze([
  {
    binary: '000000',
    id: '坤为地',
    sign: '䷁',
    phase: '土',
    palace: '坤',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '兄弟未土',
      },
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
        hostGuest: '应',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '妻财亥水',
      },
      {
        kin: '子孙酉金',
        hostGuest: '世',
      },
    ],
    yangCounts: [2, 2, 2, 2, 2, 2],
  },
  {
    binary: '100000',
    id: '地雷复',
    sign: '䷗',
    phase: '土',
    palace: '坤',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '妻财子水',
        hostGuest: '世',
      },
      {
        kin: '官鬼寅木',
      },
      {
        kin: '兄弟辰土',
      },
      {
        kin: '兄弟丑土',
        hostGuest: '应',
      },
      {
        kin: '妻财亥水',
      },
      {
        kin: '子孙酉金',
      },
    ],
    yangCounts: [1, 2, 2, 2, 2, 2],
  },
  {
    binary: '010000',
    id: '地水师',
    sign: '䷆',
    phase: '水',
    palace: '坎',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '子孙寅木',
      },
      {
        kin: '官鬼辰土',
      },
      {
        kin: '妻财午火',
        hostGuest: '世',
      },
      {
        kin: '官鬼丑土',
      },
      {
        kin: '兄弟亥水',
      },
      {
        kin: '父母酉金',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 1, 2, 2, 2, 2],
  },
  {
    binary: '110000',
    id: '地泽临',
    sign: '䷒',
    phase: '土',
    palace: '坤',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
        hostGuest: '世',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '妻财亥水',
        hostGuest: '应',
      },
      {
        kin: '子孙酉金',
      },
    ],
    yangCounts: [1, 1, 2, 2, 2, 2],
  },
  {
    binary: '001000',
    id: '地山谦',
    sign: '䷎',
    phase: '土',
    palace: '兑',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '父母辰土',
      },
      {
        kin: '官鬼午火',
        hostGuest: '应',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母丑土',
      },
      {
        kin: '子孙亥水',
        hostGuest: '世',
      },
      {
        kin: '兄弟酉金',
      },
    ],
    yangCounts: [2, 2, 1, 2, 2, 2],
  },
  {
    binary: '101000',
    id: '地火明夷',
    sign: '䷣',
    phase: '水',
    palace: '坎',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '子孙卯木',
        hostGuest: '应',
      },
      {
        kin: '官鬼丑土',
      },
      {
        kin: '兄弟亥水',
      },
      {
        kin: '官鬼丑土',
        hostGuest: '世',
      },
      {
        kin: '兄弟亥水',
      },
      {
        kin: '父母酉金',
      },
    ],
    yangCounts: [1, 2, 1, 2, 2, 2],
  },
  {
    binary: '011000',
    id: '地风升',
    sign: '䷭',
    phase: '木',
    palace: '震',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '妻财丑土',
        hostGuest: '应',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '妻财丑土',
        hostGuest: '世',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
      },
    ],
    yangCounts: [2, 1, 1, 2, 2, 2],
  },
  {
    binary: '111000',
    id: '地天泰',
    sign: '䷊',
    phase: '土',
    palace: '坤',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
      },
      {
        kin: '兄弟辰土',
        hostGuest: '世',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '妻财亥水',
      },
      {
        kin: '子孙酉金',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 1, 1, 2, 2, 2],
  },
  {
    binary: '000100',
    id: '雷地豫',
    sign: '䷏',
    phase: '木',
    palace: '震',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '妻财未土',
        hostGuest: '世',
      },
      {
        kin: '子孙巳火',
      },
      {
        kin: '兄弟卯木',
      },
      {
        kin: '子孙午火',
        hostGuest: '应',
      },
      {
        kin: '官鬼申金',
      },
      {
        kin: '妻财戌土',
      },
    ],
    yangCounts: [2, 2, 2, 1, 2, 2],
  },
  {
    binary: '100100',
    id: '震为雷',
    sign: '䷲',
    phase: '木',
    palace: '震',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
        hostGuest: '应',
      },
      {
        kin: '子孙午火',
      },
      {
        kin: '官鬼申金',
      },
      {
        kin: '妻财戌土',
        hostGuest: '世',
      },
    ],
    yangCounts: [1, 2, 2, 1, 2, 2],
  },
  {
    binary: '010100',
    id: '雷水解',
    sign: '䷧',
    phase: '木',
    palace: '震',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
        hostGuest: '世',
      },
      {
        kin: '子孙午火',
      },
      {
        kin: '子孙午火',
      },
      {
        kin: '官鬼申金',
        hostGuest: '应',
      },
      {
        kin: '妻财戌土',
      },
    ],
    yangCounts: [2, 1, 2, 1, 2, 2],
  },
  {
    binary: '110100',
    id: '雷泽归妹',
    sign: '䷵',
    phase: '金',
    palace: '兑',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '父母丑土',
        hostGuest: '世',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母戌土',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 1, 2, 1, 2, 2],
  },
  {
    binary: '001100',
    id: '雷山小过',
    sign: '䷽',
    phase: '金',
    palace: '兑',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '父母辰土',
        hostGuest: '应',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '官鬼午火',
        hostGuest: '世',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母戌土',
      },
    ],
    yangCounts: [2, 2, 1, 1, 2, 2],
  },
  {
    binary: '101100',
    id: '雷火丰',
    sign: '䷶',
    phase: '水',
    palace: '坎',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '子孙卯木',
      },
      {
        kin: '官鬼丑土',
        hostGuest: '应',
      },
      {
        kin: '兄弟亥水',
      },
      {
        kin: '妻财午火',
      },
      {
        kin: '父母申金',
        hostGuest: '世',
      },
      {
        kin: '官鬼戌土',
      },
    ],
    yangCounts: [1, 2, 1, 1, 2, 2],
  },
  {
    binary: '011100',
    id: '雷风恒',
    sign: '䷟',
    phase: '木',
    palace: '震',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '妻财丑土',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
        hostGuest: '世',
      },
      {
        kin: '子孙午火',
      },
      {
        kin: '官鬼申金',
      },
      {
        kin: '妻财戌土',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 1, 1, 1, 2, 2],
  },
  {
    binary: '111100',
    id: '雷天大壮',
    sign: '䷡',
    phase: '土',
    palace: '坤',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '妻财子水',
        hostGuest: '应',
      },
      {
        kin: '官鬼寅木',
      },
      {
        kin: '兄弟辰土',
      },
      {
        kin: '父母午火',
        hostGuest: '世',
      },
      {
        kin: '子孙申金',
      },
      {
        kin: '兄弟戌土',
      },
    ],
    yangCounts: [1, 1, 1, 1, 2, 2],
  },
  {
    binary: '000010',
    id: '水地比',
    sign: '䷇',
    phase: '土',
    palace: '坤',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '兄弟未土',
      },
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
        hostGuest: '世',
      },
      {
        kin: '子孙申金',
      },
      {
        kin: '兄弟戌土',
      },
      {
        kin: '妻财子水',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 2, 2, 2, 1, 2],
  },
  {
    binary: '100010',
    id: '水雷屯',
    sign: '䷂',
    phase: '水',
    palace: '坎',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '兄弟子水',
      },
      {
        kin: '子孙寅木',
        hostGuest: '世',
      },
      {
        kin: '官鬼辰土',
      },
      {
        kin: '父母申金',
      },
      {
        kin: '官鬼戌土',
        hostGuest: '应',
      },
      {
        kin: '兄弟子水',
      },
    ],
    yangCounts: [1, 2, 2, 2, 1, 2],
  },
  {
    binary: '010010',
    id: '坎为水',
    sign: '䷜',
    phase: '水',
    palace: '坎',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '子孙寅木',
      },
      {
        kin: '官鬼辰土',
      },
      {
        kin: '妻财午火',
        hostGuest: '应',
      },
      {
        kin: '父母申金',
      },
      {
        kin: '官鬼戌土',
      },
      {
        kin: '兄弟子水',
        hostGuest: '世',
      },
    ],
    yangCounts: [2, 1, 2, 2, 1, 2],
  },
  {
    binary: '110010',
    id: '水泽节',
    sign: '䷻',
    phase: '水',
    palace: '坎',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '妻财巳火',
        hostGuest: '世',
      },
      {
        kin: '子孙卯木',
      },
      {
        kin: '官鬼丑土',
      },
      {
        kin: '父母申金',
        hostGuest: '应',
      },
      {
        kin: '官鬼戌土',
      },
      {
        kin: '兄弟子水',
      },
    ],
    yangCounts: [1, 1, 2, 2, 1, 2],
  },
  {
    binary: '001010',
    id: '水山蹇',
    sign: '䷦',
    phase: '金',
    palace: '兑',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '父母辰土',
        hostGuest: '应',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '兄弟申金',
        hostGuest: '世',
      },
      {
        kin: '父母戌土',
      },
      {
        kin: '子孙子水',
      },
    ],
    yangCounts: [2, 2, 1, 2, 1, 2],
  },
  {
    binary: '101010',
    id: '水火既济',
    sign: '䷾',
    phase: '水',
    palace: '坎',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '子孙卯木',
      },
      {
        kin: '官鬼丑土',
      },
      {
        kin: '兄弟亥水',
        hostGuest: '世',
      },
      {
        kin: '父母申金',
      },
      {
        kin: '官鬼戌土',
      },
      {
        kin: '兄弟子水',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 2, 1, 2, 1, 2],
  },
  {
    binary: '011010',
    id: '水风井',
    sign: '䷯',
    phase: '木',
    palace: '震',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '妻财丑土',
      },
      {
        kin: '父母亥水',
        hostGuest: '应',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '官鬼申金',
      },
      {
        kin: '妻财戌土',
        hostGuest: '世',
      },
      {
        kin: '父母子水',
      },
    ],
    yangCounts: [2, 1, 1, 2, 1, 2],
  },
  {
    binary: '111010',
    id: '水天需',
    sign: '䷄',
    phase: '土',
    palace: '坤',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '妻财子水',
        hostGuest: '应',
      },
      {
        kin: '官鬼寅木',
      },
      {
        kin: '兄弟辰土',
      },
      {
        kin: '子孙申金',
        hostGuest: '世',
      },
      {
        kin: '兄弟戌土',
      },
      {
        kin: '妻财子水',
      },
    ],
    yangCounts: [1, 1, 1, 2, 1, 2],
  },
  {
    binary: '000110',
    id: '泽地萃',
    sign: '䷬',
    phase: '金',
    palace: '兑',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '父母未土',
      },
      {
        kin: '官鬼巳火',
        hostGuest: '世',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '子孙亥水',
      },
      {
        kin: '兄弟酉金',
        hostGuest: '应',
      },
      {
        kin: '父母未土',
      },
    ],
    yangCounts: [2, 2, 2, 1, 1, 2],
  },
  {
    binary: '100110',
    id: '泽雷随',
    sign: '䷐',
    phase: '木',
    palace: '震',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
        hostGuest: '世',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '妻财未土',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 2, 2, 1, 1, 2],
  },
  {
    binary: '010110',
    id: '泽水困',
    sign: '䷮',
    phase: '金',
    palace: '兑',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '妻财卯木',
        hostGuest: '世',
      },
      {
        kin: '父母辰土',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '子孙亥水',
        hostGuest: '应',
      },
      {
        kin: '兄弟酉金',
      },
      {
        kin: '父母未土',
      },
    ],
    yangCounts: [2, 1, 2, 1, 1, 2],
  },
  {
    binary: '110110',
    id: '兑为泽',
    sign: '䷹',
    phase: '金',
    palace: '兑',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '父母丑土',
        hostGuest: '应',
      },
      {
        kin: '子孙亥水',
      },
      {
        kin: '兄弟酉金',
      },
      {
        kin: '父母未土',
        hostGuest: '世',
      },
    ],
    yangCounts: [1, 1, 2, 1, 1, 2],
  },
  {
    binary: '001110',
    id: '泽山咸',
    sign: '䷞',
    phase: '金',
    palace: '兑',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '父母辰土',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
        hostGuest: '世',
      },
      {
        kin: '子孙亥水',
      },
      {
        kin: '兄弟酉金',
      },
      {
        kin: '父母未土',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 2, 1, 1, 1, 2],
  },
  {
    binary: '101110',
    id: '泽火革',
    sign: '䷰',
    phase: '水',
    palace: '坎',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '子孙卯木',
        hostGuest: '应',
      },
      {
        kin: '官鬼丑土',
      },
      {
        kin: '兄弟亥水',
      },
      {
        kin: '兄弟亥水',
        hostGuest: '世',
      },
      {
        kin: '父母酉金',
      },
      {
        kin: '官鬼未土',
      },
    ],
    yangCounts: [1, 2, 1, 1, 1, 2],
  },
  {
    binary: '011110',
    id: '泽风大过',
    sign: '䷛',
    phase: '木',
    palace: '震',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '妻财丑土',
        hostGuest: '应',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '父母亥水',
        hostGuest: '世',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '妻财未土',
      },
    ],
    yangCounts: [2, 1, 1, 1, 1, 2],
  },
  {
    binary: '111110',
    id: '泽天夬',
    sign: '䷪',
    phase: '土',
    palace: '坤',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
        hostGuest: '应',
      },
      {
        kin: '兄弟辰土',
      },
      {
        kin: '妻财亥水',
      },
      {
        kin: '子孙酉金',
        hostGuest: '世',
      },
      {
        kin: '兄弟未土',
      },
    ],
    yangCounts: [1, 1, 1, 1, 1, 2],
  },
  {
    binary: '000001',
    id: '山地剥',
    sign: '䷖',
    phase: '金',
    palace: '乾',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '父母未土',
      },
      {
        kin: '官鬼巳火',
        hostGuest: '应',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '父母戌土',
      },
      {
        kin: '子孙子水',
        hostGuest: '世',
      },
      {
        kin: '妻财卯木',
      },
    ],
    yangCounts: [2, 2, 2, 2, 2, 1],
  },
  {
    binary: '100001',
    id: '山雷颐',
    sign: '䷚',
    phase: '木',
    palace: '巽',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '父母子水',
        hostGuest: '应',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
      },
      {
        kin: '妻财戌土',
        hostGuest: '世',
      },
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
      },
    ],
    yangCounts: [1, 2, 2, 2, 2, 1],
  },
  {
    binary: '010001',
    id: '山水蒙',
    sign: '䷃',
    phase: '火',
    palace: '离',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '父母寅木',
        hostGuest: '应',
      },
      {
        kin: '子孙辰土',
      },
      {
        kin: '兄弟午火',
      },
      {
        kin: '子孙戌土',
        hostGuest: '世',
      },
      {
        kin: '官鬼子水',
      },
      {
        kin: '父母寅木',
      },
    ],
    yangCounts: [2, 1, 2, 2, 2, 1],
  },
  {
    binary: '110001',
    id: '山泽损',
    sign: '䷨',
    phase: '土',
    palace: '艮',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
      },
      {
        kin: '兄弟丑土',
        hostGuest: '世',
      },
      {
        kin: '兄弟戌土',
      },
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 1, 2, 2, 2, 1],
  },
  {
    binary: '001001',
    id: '艮为山',
    sign: '䷳',
    phase: '土',
    palace: '艮',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '兄弟辰土',
      },
      {
        kin: '父母午火',
      },
      {
        kin: '子孙申金',
        hostGuest: '应',
      },
      {
        kin: '兄弟戌土',
      },
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
        hostGuest: '世',
      },
    ],
    yangCounts: [2, 2, 1, 2, 2, 1],
  },
  {
    binary: '101001',
    id: '山火贲',
    sign: '䷕',
    phase: '土',
    palace: '艮',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '官鬼卯木',
        hostGuest: '世',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '妻财亥水',
      },
      {
        kin: '兄弟戌土',
        hostGuest: '应',
      },
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
      },
    ],
    yangCounts: [1, 2, 1, 2, 2, 1],
  },
  {
    binary: '011001',
    id: '山风蛊',
    sign: '䷑',
    phase: '木',
    palace: '巽',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '妻财丑土',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
        hostGuest: '世',
      },
      {
        kin: '妻财戌土',
      },
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 1, 1, 2, 2, 1],
  },
  {
    binary: '111001',
    id: '山天大畜',
    sign: '䷙',
    phase: '土',
    palace: '艮',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '妻财子水',
      },
      {
        kin: '官鬼寅木',
        hostGuest: '世',
      },
      {
        kin: '兄弟辰土',
      },
      {
        kin: '兄弟戌土',
      },
      {
        kin: '妻财子水',
        hostGuest: '应',
      },
      {
        kin: '官鬼寅木',
      },
    ],
    yangCounts: [1, 1, 1, 2, 2, 1],
  },
  {
    binary: '000101',
    id: '火地晋',
    sign: '䷢',
    phase: '金',
    palace: '乾',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '父母未土',
        hostGuest: '应',
      },
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '兄弟酉金',
        hostGuest: '世',
      },
      {
        kin: '父母未土',
      },
      {
        kin: '官鬼巳火',
      },
    ],
    yangCounts: [2, 2, 2, 1, 2, 1],
  },
  {
    binary: '100101',
    id: '火雷噬嗑',
    sign: '䷔',
    phase: '木',
    palace: '巽',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
        hostGuest: '应',
      },
      {
        kin: '妻财辰土',
      },
      {
        kin: '官鬼酉金',
      },
      {
        kin: '妻财未土',
        hostGuest: '世',
      },
      {
        kin: '子孙巳火',
      },
    ],
    yangCounts: [1, 2, 2, 1, 2, 1],
  },
  {
    binary: '010101',
    id: '火水未济',
    sign: '䷿',
    phase: '火',
    palace: '离',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '父母寅木',
      },
      {
        kin: '子孙辰土',
      },
      {
        kin: '兄弟午火',
        hostGuest: '世',
      },
      {
        kin: '妻财酉金',
      },
      {
        kin: '子孙未土',
      },
      {
        kin: '兄弟巳火',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 1, 2, 1, 2, 1],
  },
  {
    binary: '110101',
    id: '火泽睽',
    sign: '䷥',
    phase: '土',
    palace: '艮',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '父母巳火',
        hostGuest: '应',
      },
      {
        kin: '官鬼卯木',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '子孙酉金',
        hostGuest: '世',
      },
      {
        kin: '兄弟未土',
      },
      {
        kin: '父母巳火',
      },
    ],
    yangCounts: [1, 1, 2, 1, 2, 1],
  },
  {
    binary: '001101',
    id: '火山旅',
    sign: '䷷',
    phase: '火',
    palace: '离',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '子孙辰土',
        hostGuest: '世',
      },
      {
        kin: '兄弟午火',
      },
      {
        kin: '妻财申金',
      },
      {
        kin: '妻财酉金',
        hostGuest: '应',
      },
      {
        kin: '子孙未土',
      },
      {
        kin: '兄弟巳火',
      },
    ],
    yangCounts: [2, 2, 1, 1, 2, 1],
  },
  {
    binary: '101101',
    id: '离为火',
    sign: '䷝',
    phase: '火',
    palace: '离',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '父母卯木',
      },
      {
        kin: '子孙丑土',
      },
      {
        kin: '官鬼亥水',
        hostGuest: '应',
      },
      {
        kin: '妻财酉金',
      },
      {
        kin: '子孙未土',
      },
      {
        kin: '兄弟巳火',
        hostGuest: '世',
      },
    ],
    yangCounts: [1, 2, 1, 1, 2, 1],
  },
  {
    binary: '011101',
    id: '火风鼎',
    sign: '䷱',
    phase: '火',
    palace: '离',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '子孙丑土',
      },
      {
        kin: '官鬼亥水',
        hostGuest: '世',
      },
      {
        kin: '妻财酉金',
      },
      {
        kin: '妻财酉金',
      },
      {
        kin: '子孙未土',
        hostGuest: '应',
      },
      {
        kin: '兄弟巳火',
      },
    ],
    yangCounts: [2, 1, 1, 1, 2, 1],
  },
  {
    binary: '111101',
    id: '火天大有',
    sign: '䷍',
    phase: '金',
    palace: '乾',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '子孙子水',
      },
      {
        kin: '妻财寅木',
      },
      {
        kin: '父母辰土',
        hostGuest: '世',
      },
      {
        kin: '兄弟酉金',
      },
      {
        kin: '父母未土',
      },
      {
        kin: '官鬼巳火',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 1, 1, 1, 2, 1],
  },
  {
    binary: '000011',
    id: '风地观',
    sign: '䷓',
    phase: '金',
    palace: '乾',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '父母未土',
        hostGuest: '应',
      },
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
      },
      {
        kin: '父母未土',
        hostGuest: '世',
      },
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
      },
    ],
    yangCounts: [2, 2, 2, 2, 1, 1],
  },
  {
    binary: '100011',
    id: '风雷益',
    sign: '䷩',
    phase: '木',
    palace: '巽',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '父母子水',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
        hostGuest: '世',
      },
      {
        kin: '妻财未土',
      },
      {
        kin: '子孙巳火',
      },
      {
        kin: '兄弟卯木',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 2, 2, 2, 1, 1],
  },
  {
    binary: '010011',
    id: '风水涣',
    sign: '䷺',
    phase: '火',
    palace: '离',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '父母寅木',
      },
      {
        kin: '子孙辰土',
        hostGuest: '应',
      },
      {
        kin: '兄弟午火',
      },
      {
        kin: '子孙未土',
      },
      {
        kin: '兄弟巳火',
        hostGuest: '世',
      },
      {
        kin: '父母卯木',
      },
    ],
    yangCounts: [2, 1, 2, 2, 1, 1],
  },
  {
    binary: '110011',
    id: '风泽中孚',
    sign: '䷼',
    phase: '土',
    palace: '艮',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '父母巳火',
        hostGuest: '应',
      },
      {
        kin: '官鬼卯木',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '兄弟未土',
        hostGuest: '世',
      },
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
      },
    ],
    yangCounts: [1, 1, 2, 2, 1, 1],
  },
  {
    binary: '001011',
    id: '风山渐',
    sign: '䷴',
    phase: '土',
    palace: '艮',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '兄弟辰土',
      },
      {
        kin: '父母午火',
      },
      {
        kin: '子孙申金',
        hostGuest: '世',
      },
      {
        kin: '兄弟未土',
      },
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 2, 1, 2, 1, 1],
  },
  {
    binary: '101011',
    id: '风火家人',
    sign: '䷤',
    phase: '木',
    palace: '巽',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '兄弟卯木',
      },
      {
        kin: '妻财丑土',
        hostGuest: '世',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '妻财未土',
      },
      {
        kin: '子孙巳火',
        hostGuest: '应',
      },
      {
        kin: '兄弟卯木',
      },
    ],
    yangCounts: [1, 2, 1, 2, 1, 1],
  },
  {
    binary: '011011',
    id: '巽为风',
    sign: '䷸',
    phase: '木',
    palace: '巽',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '妻财丑土',
      },
      {
        kin: '父母亥水',
      },
      {
        kin: '官鬼酉金',
        hostGuest: '应',
      },
      {
        kin: '妻财未土',
      },
      {
        kin: '子孙巳火',
      },
      {
        kin: '兄弟卯木',
        hostGuest: '世',
      },
    ],
    yangCounts: [2, 1, 1, 2, 1, 1],
  },
  {
    binary: '111011',
    id: '风天小畜',
    sign: '䷈',
    phase: '木',
    palace: '巽',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '父母子水',
        hostGuest: '世',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
      },
      {
        kin: '妻财未土',
        hostGuest: '应',
      },
      {
        kin: '子孙巳火',
      },
      {
        kin: '兄弟卯木',
      },
    ],
    yangCounts: [1, 1, 1, 2, 1, 1],
  },
  {
    binary: '000111',
    id: '天地否',
    sign: '䷋',
    phase: '金',
    palace: '乾',
    palaceIndex: 3,
    setupInfo: [
      {
        kin: '父母未土',
      },
      {
        kin: '官鬼巳火',
      },
      {
        kin: '妻财卯木',
        hostGuest: '世',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母戌土',
        hostGuest: '应',
      },
    ],
    yangCounts: [2, 2, 2, 1, 1, 1],
  },
  {
    binary: '100111',
    id: '天雷无妄',
    sign: '䷘',
    phase: '木',
    palace: '巽',
    palaceIndex: 4,
    setupInfo: [
      {
        kin: '父母子水',
        hostGuest: '应',
      },
      {
        kin: '兄弟寅木',
      },
      {
        kin: '妻财辰土',
      },
      {
        kin: '子孙午火',
        hostGuest: '世',
      },
      {
        kin: '官鬼申金',
      },
      {
        kin: '妻财戌土',
      },
    ],
    yangCounts: [1, 2, 2, 1, 1, 1],
  },
  {
    binary: '010111',
    id: '天水讼',
    sign: '䷅',
    phase: '火',
    palace: '离',
    palaceIndex: 6,
    setupInfo: [
      {
        kin: '父母寅木',
        hostGuest: '应',
      },
      {
        kin: '子孙辰土',
      },
      {
        kin: '兄弟午火',
      },
      {
        kin: '兄弟午火',
        hostGuest: '世',
      },
      {
        kin: '妻财申金',
      },
      {
        kin: '子孙戌土',
      },
    ],
    yangCounts: [2, 1, 2, 1, 1, 1],
  },
  {
    binary: '110111',
    id: '天泽履',
    sign: '䷉',
    phase: '土',
    palace: '艮',
    palaceIndex: 5,
    setupInfo: [
      {
        kin: '父母巳火',
      },
      {
        kin: '官鬼卯木',
        hostGuest: '应',
      },
      {
        kin: '兄弟丑土',
      },
      {
        kin: '父母午火',
      },
      {
        kin: '子孙申金',
        hostGuest: '世',
      },
      {
        kin: '兄弟戌土',
      },
    ],
    yangCounts: [1, 1, 2, 1, 1, 1],
  },
  {
    binary: '001111',
    id: '天山遁',
    sign: '䷠',
    phase: '金',
    palace: '乾',
    palaceIndex: 2,
    setupInfo: [
      {
        kin: '父母辰土',
      },
      {
        kin: '官鬼午火',
        hostGuest: '世',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
        hostGuest: '应',
      },
      {
        kin: '父母戌土',
      },
    ],
    yangCounts: [2, 2, 1, 1, 1, 1],
  },
  {
    binary: '101111',
    id: '天火同人',
    sign: '䷌',
    phase: '火',
    palace: '离',
    palaceIndex: 7,
    setupInfo: [
      {
        kin: '父母寅木',
      },
      {
        kin: '子孙辰土',
      },
      {
        kin: '兄弟午火',
        hostGuest: '世',
      },
      {
        kin: '子孙未土',
      },
      {
        kin: '父母巳火',
      },
      {
        kin: '子孙戌土',
        hostGuest: '应',
      },
    ],
    yangCounts: [1, 2, 1, 1, 1, 1],
  },
  {
    binary: '011111',
    id: '天风姤',
    sign: '䷫',
    phase: '金',
    palace: '乾',
    palaceIndex: 1,
    setupInfo: [
      {
        kin: '父母丑土',
        hostGuest: '世',
      },
      {
        kin: '子孙亥水',
      },
      {
        kin: '兄弟酉金',
      },
      {
        kin: '官鬼午火',
        hostGuest: '应',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母戌土',
      },
    ],
    yangCounts: [2, 1, 1, 1, 1, 1],
  },
  {
    binary: '111111',
    id: '乾为天',
    sign: '䷀',
    phase: '金',
    palace: '乾',
    palaceIndex: 0,
    setupInfo: [
      {
        kin: '子孙子水',
      },
      {
        kin: '妻财寅木',
      },
      {
        kin: '父母辰土',
        hostGuest: '应',
      },
      {
        kin: '官鬼午火',
      },
      {
        kin: '兄弟申金',
      },
      {
        kin: '父母戌土',
        hostGuest: '世',
      },
    ],
    yangCounts: [1, 1, 1, 1, 1, 1],
  },
]);

export interface TrigramInfo {
  /**
   * Presents the trigram as a 3-digit binary string. 1 represents a Yang line and 0 represents a Yin line.
   *
   * For example, "111" for 乾, "100" for 震, etc.
   */
  binary: `${0 | 1}${0 | 1}${0 | 1}`;

  /**
   * How many Yang Yaos are in the trigram, such as 0 for 坤, 1 for 震, 2 for 兑, etc.
   */
  yangCount: 0 | 1 | 2 | 3;

  /**
   * Name of the trigram in Chinese, such as "乾", "坤", "震", etc.
   */
  id: string;

  /**
   * Name of the trigram in English, such as "Qian", "Kun", "Zhen", etc.
   */
  nameEn: string;

  /**
   * What the trigram represents in Chinese, such as "天", "地", "水", etc.
   */
  represents: string;

  /**
   * What the trigram represents in English, such as "heaven", "earth", "water", etc.
   */
  representsEn: string;

  /**
   * Unicode character representing the trigram, such as "☰" for 乾, "☷" for 坤, etc.
   */
  sign: string;
}

// 老阳：○，老阴：×，少阳：’，少阴：”
/**
 * List of all trigrams in the I Ching, with their binary representation, number of yang lines, name, what they represent, and their corresponding sign.
 */
export const TrigramInfoTable: readonly TrigramInfo[] = Object.freeze([
  { id: '坤', binary: '000', yangCount: 0, represents: '地', nameEn: 'kun', representsEn: 'earth', sign: '☷' },
  { id: '震', binary: '100', yangCount: 1, represents: '雷', nameEn: 'zhen', representsEn: 'thunder', sign: '☳' },
  { id: '坎', binary: '010', yangCount: 1, represents: '水', nameEn: 'kan', representsEn: 'water', sign: '☵' },
  { id: '兑', binary: '110', yangCount: 2, represents: '泽', nameEn: 'dui', representsEn: 'lake', sign: '☱' },
  { id: '艮', binary: '001', yangCount: 1, represents: '山', nameEn: 'gen', representsEn: 'mountain', sign: '☶' },
  { id: '离', binary: '101', yangCount: 2, represents: '火', nameEn: 'li', representsEn: 'fire', sign: '☲' },
  { id: '巽', binary: '011', yangCount: 2, represents: '风', nameEn: 'xun', representsEn: 'wind', sign: '☴' },
  { id: '乾', binary: '111', yangCount: 3, represents: '天', nameEn: 'qian', representsEn: 'heaven', sign: '☰' },
]);
