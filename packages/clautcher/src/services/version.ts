import { cctl } from '../../../_shared/utils/color.js';

export function version() {
  console.log(cctl.claude + cctl.bold + 'Clautcher __VERSION__' + cctl.reset);
}
