import type { Hexagram } from '../classes/hexagram.js';
import { HeavenStem } from './common.js';

`
野鹤曰：此为多事之论也。鬼谷三才论舍爻辞，以五行而定祸福者，乃用地支。既用地支，不
得不以天干为配，未闻以天干而定吉凶，以天干配地支者，欲全用周天甲子，卦又止于四十八爻，
不得不分晰焉。
所以乾之内卦用甲，坤之内卦用乙，乃十干之首；乾之外卦用壬，坤之外卦用癸，皆十干之尾。
乾立内卦用子，与坤之外卦相合；坤之内卦用未，与乾之外卦相合。二老上下相媾，阴阳磨荡，中
包六子。甲乙之次者丙丁，用之于少男少女，艮与兑也；戊己用之于中男中女，坎与离也；庚辛用
之于长男长女，震与巽也，以全上下干支。此乃配偶之法也，故谓之浑天甲子。
而，祸福吉凶，皆地支生克制化、克合刑冲以判之。今若以天干而判休囚，则每卦皆宜用也，
何独于此？况此小畜之蛊，五爻朱雀为文书，动临巳火，变出子水文书，而世爻又临子水父母，又
为文书，酉日生之，化丑合之，叠叠文书，旺动于卦中，即非干支相合，亦难说无成。余故曰：此
多事之论也。
`;

const _mappers: Record<string, { inner: HeavenStem; outer: HeavenStem }> = {
  乾: { inner: '甲', outer: '壬' },
  坤: { inner: '乙', outer: '癸' },
  兑: { inner: '丁', outer: '丁' },
  坎: { inner: '戊', outer: '戊' },
  艮: { inner: '丙', outer: '丙' },
  离: { inner: '己', outer: '己' },
  震: { inner: '庚', outer: '庚' },
  巽: { inner: '辛', outer: '辛' },
};
export function setupHeavenStem(hexagram: Hexagram): HeavenStem[] {
  const inner = _mappers[hexagram.inner.id].inner;
  const outer = _mappers[hexagram.outer.id].outer;
  return [inner, inner, inner, outer, outer, outer];
}
