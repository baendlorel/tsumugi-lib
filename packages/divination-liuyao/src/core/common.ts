import { SetupGramInfo } from './setup-gram.js';
import { Yao } from '../classes/yao.js';

`
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
`;

export const FamilyIndexName = [
  '本宫卦',
  '一世卦',
  '二世卦',
  '三世卦',
  '四世卦',
  '五世卦',
  '游魂卦',
  '归魂卦',
] as const;

export interface HexagramInfo {
  /**
   * 卦象的二进制表示
   * - 0表示阴爻，1表示阳爻
   * - 从左到右依次为初爻、二爻、三爻、四爻、五爻、上爻
   */
  binary: string;

  /**
   * 加上了上下两卦名字的卦名
   * @example 坤为地、地雷复、地水师等
   */
  id: string;

  /**
   * 64卦对应的Unicode符号
   */
  sign: string;

  /**
   * 五行
   * @description 并非五种元素，而是5种状态变化
   */
  state: '金' | '木' | '水' | '火' | '土';

  /**
   * 八宫六十四卦
   * @description 宫不是宫殿，而是一类、一族
   */
  family: '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

  /**
   * 八宫索引
   * @description 本宫、一世、二世、三世、四世、五世、游魂、归魂
   */
  familyIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

  /**
   * 世应信息
   * @description 世应是六爻占卜中的重要概念，代表了占卜者（世）和对方（应）的关系
   */
  setupInfo: [SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo, SetupGramInfo];
}

export const Hexagrams = {
  list: [
    {
      binary: '000000',
      id: '坤为地',
      sign: '䷁',
      state: '土',
      family: '坤',
      familyIndex: 0,
      setupInfo: [
        {
          description: '兄弟未土',
        },
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
          type: '应',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '妻财亥水',
        },
        {
          description: '子孙酉金',
          type: '世',
        },
      ],
    },
    {
      binary: '100000',
      id: '地雷复',
      sign: '䷗',
      state: '土',
      family: '坤',
      familyIndex: 1,
      setupInfo: [
        {
          description: '妻财子水',
          type: '世',
        },
        {
          description: '官鬼寅木',
        },
        {
          description: '兄弟辰土',
        },
        {
          description: '兄弟丑土',
          type: '应',
        },
        {
          description: '妻财亥水',
        },
        {
          description: '子孙酉金',
        },
      ],
    },
    {
      binary: '010000',
      id: '地水师',
      sign: '䷆',
      state: '水',
      family: '坎',
      familyIndex: 7,
      setupInfo: [
        {
          description: '子孙寅木',
        },
        {
          description: '官鬼辰土',
        },
        {
          description: '妻财午火',
          type: '世',
        },
        {
          description: '官鬼丑土',
        },
        {
          description: '兄弟亥水',
        },
        {
          description: '父母酉金',
          type: '应',
        },
      ],
    },
    {
      binary: '110000',
      id: '地泽临',
      sign: '䷒',
      state: '土',
      family: '坤',
      familyIndex: 2,
      setupInfo: [
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
          type: '世',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '妻财亥水',
          type: '应',
        },
        {
          description: '子孙酉金',
        },
      ],
    },
    {
      binary: '001000',
      id: '地山谦',
      sign: '䷎',
      state: '土',
      family: '兑',
      familyIndex: 5,
      setupInfo: [
        {
          description: '父母辰土',
        },
        {
          description: '官鬼午火',
          type: '应',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母丑土',
        },
        {
          description: '子孙亥水',
          type: '世',
        },
        {
          description: '兄弟酉金',
        },
      ],
    },
    {
      binary: '101000',
      id: '地火明夷',
      sign: '䷣',
      state: '水',
      family: '坎',
      familyIndex: 6,
      setupInfo: [
        {
          description: '子孙卯木',
          type: '应',
        },
        {
          description: '官鬼丑土',
        },
        {
          description: '兄弟亥水',
        },
        {
          description: '官鬼丑土',
          type: '世',
        },
        {
          description: '兄弟亥水',
        },
        {
          description: '父母酉金',
        },
      ],
    },
    {
      binary: '011000',
      id: '地风升',
      sign: '䷭',
      state: '木',
      family: '震',
      familyIndex: 4,
      setupInfo: [
        {
          description: '妻财丑土',
          type: '应',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '妻财丑土',
          type: '世',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
        },
      ],
    },
    {
      binary: '111000',
      id: '地天泰',
      sign: '䷊',
      state: '土',
      family: '坤',
      familyIndex: 3,
      setupInfo: [
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
        },
        {
          description: '兄弟辰土',
          type: '世',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '妻财亥水',
        },
        {
          description: '子孙酉金',
          type: '应',
        },
      ],
    },
    {
      binary: '000100',
      id: '雷地豫',
      sign: '䷏',
      state: '木',
      family: '震',
      familyIndex: 1,
      setupInfo: [
        {
          description: '妻财未土',
          type: '世',
        },
        {
          description: '子孙巳火',
        },
        {
          description: '兄弟卯木',
        },
        {
          description: '子孙午火',
          type: '应',
        },
        {
          description: '官鬼申金',
        },
        {
          description: '妻财戌土',
        },
      ],
    },
    {
      binary: '100100',
      id: '震为雷',
      sign: '䷲',
      state: '木',
      family: '震',
      familyIndex: 0,
      setupInfo: [
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
          type: '应',
        },
        {
          description: '子孙午火',
        },
        {
          description: '官鬼申金',
        },
        {
          description: '妻财戌土',
          type: '世',
        },
      ],
    },
    {
      binary: '010100',
      id: '雷水解',
      sign: '䷧',
      state: '木',
      family: '震',
      familyIndex: 2,
      setupInfo: [
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
          type: '世',
        },
        {
          description: '子孙午火',
        },
        {
          description: '子孙午火',
        },
        {
          description: '官鬼申金',
          type: '应',
        },
        {
          description: '妻财戌土',
        },
      ],
    },
    {
      binary: '110100',
      id: '雷泽归妹',
      sign: '䷵',
      state: '金',
      family: '兑',
      familyIndex: 7,
      setupInfo: [
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '父母丑土',
          type: '世',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母戌土',
          type: '应',
        },
      ],
    },
    {
      binary: '001100',
      id: '雷山小过',
      sign: '䷽',
      state: '金',
      family: '兑',
      familyIndex: 6,
      setupInfo: [
        {
          description: '父母辰土',
          type: '应',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '官鬼午火',
          type: '世',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母戌土',
        },
      ],
    },
    {
      binary: '101100',
      id: '雷火丰',
      sign: '䷶',
      state: '水',
      family: '坎',
      familyIndex: 5,
      setupInfo: [
        {
          description: '子孙卯木',
        },
        {
          description: '官鬼丑土',
          type: '应',
        },
        {
          description: '兄弟亥水',
        },
        {
          description: '妻财午火',
        },
        {
          description: '父母申金',
          type: '世',
        },
        {
          description: '官鬼戌土',
        },
      ],
    },
    {
      binary: '011100',
      id: '雷风恒',
      sign: '䷟',
      state: '木',
      family: '震',
      familyIndex: 3,
      setupInfo: [
        {
          description: '妻财丑土',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
          type: '世',
        },
        {
          description: '子孙午火',
        },
        {
          description: '官鬼申金',
        },
        {
          description: '妻财戌土',
          type: '应',
        },
      ],
    },
    {
      binary: '111100',
      id: '雷天大壮',
      sign: '䷡',
      state: '土',
      family: '坤',
      familyIndex: 4,
      setupInfo: [
        {
          description: '妻财子水',
          type: '应',
        },
        {
          description: '官鬼寅木',
        },
        {
          description: '兄弟辰土',
        },
        {
          description: '父母午火',
          type: '世',
        },
        {
          description: '子孙申金',
        },
        {
          description: '兄弟戌土',
        },
      ],
    },
    {
      binary: '000010',
      id: '水地比',
      sign: '䷇',
      state: '土',
      family: '坤',
      familyIndex: 7,
      setupInfo: [
        {
          description: '兄弟未土',
        },
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
          type: '世',
        },
        {
          description: '子孙申金',
        },
        {
          description: '兄弟戌土',
        },
        {
          description: '妻财子水',
          type: '应',
        },
      ],
    },
    {
      binary: '100010',
      id: '水雷屯',
      sign: '䷂',
      state: '水',
      family: '坎',
      familyIndex: 2,
      setupInfo: [
        {
          description: '兄弟子水',
        },
        {
          description: '子孙寅木',
          type: '世',
        },
        {
          description: '官鬼辰土',
        },
        {
          description: '父母申金',
        },
        {
          description: '官鬼戌土',
          type: '应',
        },
        {
          description: '兄弟子水',
        },
      ],
    },
    {
      binary: '010010',
      id: '坎为水',
      sign: '䷜',
      state: '水',
      family: '坎',
      familyIndex: 0,
      setupInfo: [
        {
          description: '子孙寅木',
        },
        {
          description: '官鬼辰土',
        },
        {
          description: '妻财午火',
          type: '应',
        },
        {
          description: '父母申金',
        },
        {
          description: '官鬼戌土',
        },
        {
          description: '兄弟子水',
          type: '世',
        },
      ],
    },
    {
      binary: '110010',
      id: '水泽节',
      sign: '䷻',
      state: '水',
      family: '坎',
      familyIndex: 1,
      setupInfo: [
        {
          description: '妻财巳火',
          type: '世',
        },
        {
          description: '子孙卯木',
        },
        {
          description: '官鬼丑土',
        },
        {
          description: '父母申金',
          type: '应',
        },
        {
          description: '官鬼戌土',
        },
        {
          description: '兄弟子水',
        },
      ],
    },
    {
      binary: '001010',
      id: '水山蹇',
      sign: '䷦',
      state: '金',
      family: '兑',
      familyIndex: 4,
      setupInfo: [
        {
          description: '父母辰土',
          type: '应',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '兄弟申金',
          type: '世',
        },
        {
          description: '父母戌土',
        },
        {
          description: '子孙子水',
        },
      ],
    },
    {
      binary: '101010',
      id: '水火既济',
      sign: '䷾',
      state: '水',
      family: '坎',
      familyIndex: 3,
      setupInfo: [
        {
          description: '子孙卯木',
        },
        {
          description: '官鬼丑土',
        },
        {
          description: '兄弟亥水',
          type: '世',
        },
        {
          description: '父母申金',
        },
        {
          description: '官鬼戌土',
        },
        {
          description: '兄弟子水',
          type: '应',
        },
      ],
    },
    {
      binary: '011010',
      id: '水风井',
      sign: '䷯',
      state: '木',
      family: '震',
      familyIndex: 5,
      setupInfo: [
        {
          description: '妻财丑土',
        },
        {
          description: '父母亥水',
          type: '应',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '官鬼申金',
        },
        {
          description: '妻财戌土',
          type: '世',
        },
        {
          description: '父母子水',
        },
      ],
    },
    {
      binary: '111010',
      id: '水天需',
      sign: '䷄',
      state: '土',
      family: '坤',
      familyIndex: 6,
      setupInfo: [
        {
          description: '妻财子水',
          type: '应',
        },
        {
          description: '官鬼寅木',
        },
        {
          description: '兄弟辰土',
        },
        {
          description: '子孙申金',
          type: '世',
        },
        {
          description: '兄弟戌土',
        },
        {
          description: '妻财子水',
        },
      ],
    },
    {
      binary: '000110',
      id: '泽地萃',
      sign: '䷬',
      state: '金',
      family: '兑',
      familyIndex: 2,
      setupInfo: [
        {
          description: '父母未土',
        },
        {
          description: '官鬼巳火',
          type: '世',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '子孙亥水',
        },
        {
          description: '兄弟酉金',
          type: '应',
        },
        {
          description: '父母未土',
        },
      ],
    },
    {
      binary: '100110',
      id: '泽雷随',
      sign: '䷐',
      state: '木',
      family: '震',
      familyIndex: 7,
      setupInfo: [
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
          type: '世',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '妻财未土',
          type: '应',
        },
      ],
    },
    {
      binary: '010110',
      id: '泽水困',
      sign: '䷮',
      state: '金',
      family: '兑',
      familyIndex: 1,
      setupInfo: [
        {
          description: '妻财卯木',
          type: '世',
        },
        {
          description: '父母辰土',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '子孙亥水',
          type: '应',
        },
        {
          description: '兄弟酉金',
        },
        {
          description: '父母未土',
        },
      ],
    },
    {
      binary: '110110',
      id: '兑为泽',
      sign: '䷹',
      state: '金',
      family: '兑',
      familyIndex: 0,
      setupInfo: [
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '父母丑土',
          type: '应',
        },
        {
          description: '子孙亥水',
        },
        {
          description: '兄弟酉金',
        },
        {
          description: '父母未土',
          type: '世',
        },
      ],
    },
    {
      binary: '001110',
      id: '泽山咸',
      sign: '䷞',
      state: '金',
      family: '兑',
      familyIndex: 3,
      setupInfo: [
        {
          description: '父母辰土',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
          type: '世',
        },
        {
          description: '子孙亥水',
        },
        {
          description: '兄弟酉金',
        },
        {
          description: '父母未土',
          type: '应',
        },
      ],
    },
    {
      binary: '101110',
      id: '泽火革',
      sign: '䷰',
      state: '水',
      family: '坎',
      familyIndex: 4,
      setupInfo: [
        {
          description: '子孙卯木',
          type: '应',
        },
        {
          description: '官鬼丑土',
        },
        {
          description: '兄弟亥水',
        },
        {
          description: '兄弟亥水',
          type: '世',
        },
        {
          description: '父母酉金',
        },
        {
          description: '官鬼未土',
        },
      ],
    },
    {
      binary: '011110',
      id: '泽风大过',
      sign: '䷛',
      state: '木',
      family: '震',
      familyIndex: 6,
      setupInfo: [
        {
          description: '妻财丑土',
          type: '应',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '父母亥水',
          type: '世',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '妻财未土',
        },
      ],
    },
    {
      binary: '111110',
      id: '泽天夬',
      sign: '䷪',
      state: '土',
      family: '坤',
      familyIndex: 5,
      setupInfo: [
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
          type: '应',
        },
        {
          description: '兄弟辰土',
        },
        {
          description: '妻财亥水',
        },
        {
          description: '子孙酉金',
          type: '世',
        },
        {
          description: '兄弟未土',
        },
      ],
    },
    {
      binary: '000001',
      id: '山地剥',
      sign: '䷖',
      state: '金',
      family: '乾',
      familyIndex: 5,
      setupInfo: [
        {
          description: '父母未土',
        },
        {
          description: '官鬼巳火',
          type: '应',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '父母戌土',
        },
        {
          description: '子孙子水',
          type: '世',
        },
        {
          description: '妻财卯木',
        },
      ],
    },
    {
      binary: '100001',
      id: '山雷颐',
      sign: '䷚',
      state: '木',
      family: '巽',
      familyIndex: 6,
      setupInfo: [
        {
          description: '父母子水',
          type: '应',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
        },
        {
          description: '妻财戌土',
          type: '世',
        },
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
        },
      ],
    },
    {
      binary: '010001',
      id: '山水蒙',
      sign: '䷃',
      state: '火',
      family: '离',
      familyIndex: 4,
      setupInfo: [
        {
          description: '父母寅木',
          type: '应',
        },
        {
          description: '子孙辰土',
        },
        {
          description: '兄弟午火',
        },
        {
          description: '子孙戌土',
          type: '世',
        },
        {
          description: '官鬼子水',
        },
        {
          description: '父母寅木',
        },
      ],
    },
    {
      binary: '110001',
      id: '山泽损',
      sign: '䷨',
      state: '土',
      family: '艮',
      familyIndex: 3,
      setupInfo: [
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
        },
        {
          description: '兄弟丑土',
          type: '世',
        },
        {
          description: '兄弟戌土',
        },
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
          type: '应',
        },
      ],
    },
    {
      binary: '001001',
      id: '艮为山',
      sign: '䷳',
      state: '土',
      family: '艮',
      familyIndex: 0,
      setupInfo: [
        {
          description: '兄弟辰土',
        },
        {
          description: '父母午火',
        },
        {
          description: '子孙申金',
          type: '应',
        },
        {
          description: '兄弟戌土',
        },
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
          type: '世',
        },
      ],
    },
    {
      binary: '101001',
      id: '山火贲',
      sign: '䷕',
      state: '土',
      family: '艮',
      familyIndex: 1,
      setupInfo: [
        {
          description: '官鬼卯木',
          type: '世',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '妻财亥水',
        },
        {
          description: '兄弟戌土',
          type: '应',
        },
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
        },
      ],
    },
    {
      binary: '011001',
      id: '山风蛊',
      sign: '䷑',
      state: '木',
      family: '巽',
      familyIndex: 7,
      setupInfo: [
        {
          description: '妻财丑土',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
          type: '世',
        },
        {
          description: '妻财戌土',
        },
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
          type: '应',
        },
      ],
    },
    {
      binary: '111001',
      id: '山天大畜',
      sign: '䷙',
      state: '土',
      family: '艮',
      familyIndex: 2,
      setupInfo: [
        {
          description: '妻财子水',
        },
        {
          description: '官鬼寅木',
          type: '世',
        },
        {
          description: '兄弟辰土',
        },
        {
          description: '兄弟戌土',
        },
        {
          description: '妻财子水',
          type: '应',
        },
        {
          description: '官鬼寅木',
        },
      ],
    },
    {
      binary: '000101',
      id: '火地晋',
      sign: '䷢',
      state: '金',
      family: '乾',
      familyIndex: 6,
      setupInfo: [
        {
          description: '父母未土',
          type: '应',
        },
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '兄弟酉金',
          type: '世',
        },
        {
          description: '父母未土',
        },
        {
          description: '官鬼巳火',
        },
      ],
    },
    {
      binary: '100101',
      id: '火雷噬嗑',
      sign: '䷔',
      state: '木',
      family: '巽',
      familyIndex: 5,
      setupInfo: [
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
          type: '应',
        },
        {
          description: '妻财辰土',
        },
        {
          description: '官鬼酉金',
        },
        {
          description: '妻财未土',
          type: '世',
        },
        {
          description: '子孙巳火',
        },
      ],
    },
    {
      binary: '010101',
      id: '火水未济',
      sign: '䷿',
      state: '火',
      family: '离',
      familyIndex: 3,
      setupInfo: [
        {
          description: '父母寅木',
        },
        {
          description: '子孙辰土',
        },
        {
          description: '兄弟午火',
          type: '世',
        },
        {
          description: '妻财酉金',
        },
        {
          description: '子孙未土',
        },
        {
          description: '兄弟巳火',
          type: '应',
        },
      ],
    },
    {
      binary: '110101',
      id: '火泽睽',
      sign: '䷥',
      state: '土',
      family: '艮',
      familyIndex: 4,
      setupInfo: [
        {
          description: '父母巳火',
          type: '应',
        },
        {
          description: '官鬼卯木',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '子孙酉金',
          type: '世',
        },
        {
          description: '兄弟未土',
        },
        {
          description: '父母巳火',
        },
      ],
    },
    {
      binary: '001101',
      id: '火山旅',
      sign: '䷷',
      state: '火',
      family: '离',
      familyIndex: 1,
      setupInfo: [
        {
          description: '子孙辰土',
          type: '世',
        },
        {
          description: '兄弟午火',
        },
        {
          description: '妻财申金',
        },
        {
          description: '妻财酉金',
          type: '应',
        },
        {
          description: '子孙未土',
        },
        {
          description: '兄弟巳火',
        },
      ],
    },
    {
      binary: '101101',
      id: '离为火',
      sign: '䷝',
      state: '火',
      family: '离',
      familyIndex: 0,
      setupInfo: [
        {
          description: '父母卯木',
        },
        {
          description: '子孙丑土',
        },
        {
          description: '官鬼亥水',
          type: '应',
        },
        {
          description: '妻财酉金',
        },
        {
          description: '子孙未土',
        },
        {
          description: '兄弟巳火',
          type: '世',
        },
      ],
    },
    {
      binary: '011101',
      id: '火风鼎',
      sign: '䷱',
      state: '火',
      family: '离',
      familyIndex: 2,
      setupInfo: [
        {
          description: '子孙丑土',
        },
        {
          description: '官鬼亥水',
          type: '世',
        },
        {
          description: '妻财酉金',
        },
        {
          description: '妻财酉金',
        },
        {
          description: '子孙未土',
          type: '应',
        },
        {
          description: '兄弟巳火',
        },
      ],
    },
    {
      binary: '111101',
      id: '火天大有',
      sign: '䷍',
      state: '金',
      family: '乾',
      familyIndex: 7,
      setupInfo: [
        {
          description: '子孙子水',
        },
        {
          description: '妻财寅木',
        },
        {
          description: '父母辰土',
          type: '世',
        },
        {
          description: '兄弟酉金',
        },
        {
          description: '父母未土',
        },
        {
          description: '官鬼巳火',
          type: '应',
        },
      ],
    },
    {
      binary: '000011',
      id: '风地观',
      sign: '䷓',
      state: '金',
      family: '乾',
      familyIndex: 4,
      setupInfo: [
        {
          description: '父母未土',
          type: '应',
        },
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
        },
        {
          description: '父母未土',
          type: '世',
        },
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
        },
      ],
    },
    {
      binary: '100011',
      id: '风雷益',
      sign: '䷩',
      state: '木',
      family: '巽',
      familyIndex: 3,
      setupInfo: [
        {
          description: '父母子水',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
          type: '世',
        },
        {
          description: '妻财未土',
        },
        {
          description: '子孙巳火',
        },
        {
          description: '兄弟卯木',
          type: '应',
        },
      ],
    },
    {
      binary: '010011',
      id: '风水涣',
      sign: '䷺',
      state: '火',
      family: '离',
      familyIndex: 5,
      setupInfo: [
        {
          description: '父母寅木',
        },
        {
          description: '子孙辰土',
          type: '应',
        },
        {
          description: '兄弟午火',
        },
        {
          description: '子孙未土',
        },
        {
          description: '兄弟巳火',
          type: '世',
        },
        {
          description: '父母卯木',
        },
      ],
    },
    {
      binary: '110011',
      id: '风泽中孚',
      sign: '䷼',
      state: '土',
      family: '艮',
      familyIndex: 6,
      setupInfo: [
        {
          description: '父母巳火',
          type: '应',
        },
        {
          description: '官鬼卯木',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '兄弟未土',
          type: '世',
        },
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
        },
      ],
    },
    {
      binary: '001011',
      id: '风山渐',
      sign: '䷴',
      state: '土',
      family: '艮',
      familyIndex: 7,
      setupInfo: [
        {
          description: '兄弟辰土',
        },
        {
          description: '父母午火',
        },
        {
          description: '子孙申金',
          type: '世',
        },
        {
          description: '兄弟未土',
        },
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
          type: '应',
        },
      ],
    },
    {
      binary: '101011',
      id: '风火家人',
      sign: '䷤',
      state: '木',
      family: '巽',
      familyIndex: 2,
      setupInfo: [
        {
          description: '兄弟卯木',
        },
        {
          description: '妻财丑土',
          type: '世',
        },
        {
          description: '父母亥水',
        },
        {
          description: '妻财未土',
        },
        {
          description: '子孙巳火',
          type: '应',
        },
        {
          description: '兄弟卯木',
        },
      ],
    },
    {
      binary: '011011',
      id: '巽为风',
      sign: '䷸',
      state: '木',
      family: '巽',
      familyIndex: 0,
      setupInfo: [
        {
          description: '妻财丑土',
        },
        {
          description: '父母亥水',
        },
        {
          description: '官鬼酉金',
          type: '应',
        },
        {
          description: '妻财未土',
        },
        {
          description: '子孙巳火',
        },
        {
          description: '兄弟卯木',
          type: '世',
        },
      ],
    },
    {
      binary: '111011',
      id: '风天小畜',
      sign: '䷈',
      state: '木',
      family: '巽',
      familyIndex: 1,
      setupInfo: [
        {
          description: '父母子水',
          type: '世',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
        },
        {
          description: '妻财未土',
          type: '应',
        },
        {
          description: '子孙巳火',
        },
        {
          description: '兄弟卯木',
        },
      ],
    },
    {
      binary: '000111',
      id: '天地否',
      sign: '䷋',
      state: '金',
      family: '乾',
      familyIndex: 3,
      setupInfo: [
        {
          description: '父母未土',
        },
        {
          description: '官鬼巳火',
        },
        {
          description: '妻财卯木',
          type: '世',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母戌土',
          type: '应',
        },
      ],
    },
    {
      binary: '100111',
      id: '天雷无妄',
      sign: '䷘',
      state: '木',
      family: '巽',
      familyIndex: 4,
      setupInfo: [
        {
          description: '父母子水',
          type: '应',
        },
        {
          description: '兄弟寅木',
        },
        {
          description: '妻财辰土',
        },
        {
          description: '子孙午火',
          type: '世',
        },
        {
          description: '官鬼申金',
        },
        {
          description: '妻财戌土',
        },
      ],
    },
    {
      binary: '010111',
      id: '天水讼',
      sign: '䷅',
      state: '火',
      family: '离',
      familyIndex: 6,
      setupInfo: [
        {
          description: '父母寅木',
          type: '应',
        },
        {
          description: '子孙辰土',
        },
        {
          description: '兄弟午火',
        },
        {
          description: '兄弟午火',
          type: '世',
        },
        {
          description: '妻财申金',
        },
        {
          description: '子孙戌土',
        },
      ],
    },
    {
      binary: '110111',
      id: '天泽履',
      sign: '䷉',
      state: '土',
      family: '艮',
      familyIndex: 5,
      setupInfo: [
        {
          description: '父母巳火',
        },
        {
          description: '官鬼卯木',
          type: '应',
        },
        {
          description: '兄弟丑土',
        },
        {
          description: '父母午火',
        },
        {
          description: '子孙申金',
          type: '世',
        },
        {
          description: '兄弟戌土',
        },
      ],
    },
    {
      binary: '001111',
      id: '天山遁',
      sign: '䷠',
      state: '金',
      family: '乾',
      familyIndex: 2,
      setupInfo: [
        {
          description: '父母辰土',
        },
        {
          description: '官鬼午火',
          type: '世',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
          type: '应',
        },
        {
          description: '父母戌土',
        },
      ],
    },
    {
      binary: '101111',
      id: '天火同人',
      sign: '䷌',
      state: '火',
      family: '离',
      familyIndex: 7,
      setupInfo: [
        {
          description: '父母寅木',
        },
        {
          description: '子孙辰土',
        },
        {
          description: '兄弟午火',
          type: '世',
        },
        {
          description: '子孙未土',
        },
        {
          description: '父母巳火',
        },
        {
          description: '子孙戌土',
          type: '应',
        },
      ],
    },
    {
      binary: '011111',
      id: '天风姤',
      sign: '䷫',
      state: '金',
      family: '乾',
      familyIndex: 1,
      setupInfo: [
        {
          description: '父母丑土',
          type: '世',
        },
        {
          description: '子孙亥水',
        },
        {
          description: '兄弟酉金',
        },
        {
          description: '官鬼午火',
          type: '应',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母戌土',
        },
      ],
    },
    {
      binary: '111111',
      id: '乾为天',
      sign: '䷀',
      state: '金',
      family: '乾',
      familyIndex: 0,
      setupInfo: [
        {
          description: '子孙子水',
        },
        {
          description: '妻财寅木',
        },
        {
          description: '父母辰土',
          type: '应',
        },
        {
          description: '官鬼午火',
        },
        {
          description: '兄弟申金',
        },
        {
          description: '父母戌土',
          type: '世',
        },
      ],
    },
  ] satisfies HexagramInfo[],
  find(binary: string) {
    const info = this.list.find((h) => h.binary === binary);
    if (!info) {
      throw new Error(`六十四卦：无法通过二进制找到卦象 ${binary}`);
    }
    return info;
  },
  findByYaos(yaos: Yao[]) {
    const binary = yaos.map((y) => y.polar).join('');
    return this.find(binary);
  },
};

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
  name: string;

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
export const TrigramList: readonly TrigramInfo[] = Object.freeze([
  { binary: '000', yangCount: 0, name: '坤', represents: '地', nameEn: '', representsEn: '', sign: '☷' },
  { binary: '100', yangCount: 1, name: '震', represents: '雷', nameEn: '', representsEn: '', sign: '☳' },
  { binary: '010', yangCount: 1, name: '坎', represents: '水', nameEn: '', representsEn: '', sign: '☵' },
  { binary: '110', yangCount: 2, name: '兑', represents: '泽', nameEn: '', representsEn: '', sign: '☱' },
  { binary: '001', yangCount: 1, name: '艮', represents: '山', nameEn: '', representsEn: '', sign: '☶' },
  { binary: '101', yangCount: 2, name: '离', represents: '火', nameEn: '', representsEn: '', sign: '☲' },
  { binary: '011', yangCount: 2, name: '巽', represents: '风', nameEn: '', representsEn: '', sign: '☴' },
  { binary: '111', yangCount: 3, name: '乾', represents: '天', nameEn: '', representsEn: '', sign: '☰' },
]);
