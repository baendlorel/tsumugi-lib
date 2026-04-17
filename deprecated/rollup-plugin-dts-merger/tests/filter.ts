import { createFilter } from '@rollup/pluginutils';
import { join } from 'path';

const filterStarSlashDts = createFilter(['src/**/*.d.ts']);
const filterStarStar = createFilter(['src/**']);
const filterStar = createFilter(['src/*']);
const filter = createFilter(['src']);
const p = join(process.cwd(), 'src/global.d.ts');
console.log('filterStarSlashDts', filterStarSlashDts(p));
console.log('filterStarStar', filterStarStar(p));
console.log('filterStar', filterStar(p));
console.log('filter', filter(p));

const f1 = createFilter('/home/aldia/projects/plugins/rollup-plugin-dts-merger/tests/mocks/*.d.ts');
console.log(
  'f1',
  f1('/home/aldia/projects/plugins/rollup-plugin-dts-merger/tests/mocks/common.d.ts')
);
