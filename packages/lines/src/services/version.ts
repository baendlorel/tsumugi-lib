import { cctl } from '@shared/utils/color.js';

export function version() {
  console.log(cctl.yellow + cctl.bold + 'How Many Lines __VERSION__' + cctl.reset);
}
