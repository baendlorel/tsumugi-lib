import type { Hexagram } from '../classes/hexagram.js';
`
世应章
乾为天：世在六爻；天风姤：世在初爻；天山遁：世在二爻；火地晋：世退在四爻；
天地否：世在三爻；风地观：世在四爻；山地剥：世在五爻；火天大有：世退在三爻；
隔世爻两位，即是应爻。余卦仿此。
`;

const _h = [5, 0, 1, 2, 3, 4, 3, 2];
const _g = [2, 3, 4, 5, 0, 1, 0, 5]; // _h.map((v) => (v + 3) % 6);
/**
 * @see 《增删卜易·世应章》
 */
export function setupHostGuest(hexagram: Hexagram): { host: number; guest: number } {
  return {
    host: _h[hexagram.generation],
    guest: _g[hexagram.generation],
  };
}
