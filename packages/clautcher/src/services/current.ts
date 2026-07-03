import { cctl } from '@shared/utils/color.js';
import { settings } from '../common/index.js';

export function current(): void {
  const json = settings.tryLoad();
  console.log(`${cctl.bold}${cctl.underline}Now Using:${cctl.reset}`);
  if (json?.clautcher_activated_settings) {
    console.log(`  ${cctl.brightGreen}${json.clautcher_activated_settings}${cctl.reset}`);
  } else {
    console.log(`  ${cctl.dim}None (Not managed by clautcher yet)${cctl.reset}`);
  }
}
