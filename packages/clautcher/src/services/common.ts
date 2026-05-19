import { cctl } from '../../../_shared/utils/color.js';
import { state } from '../common.js';

export function current(claudeDir: string, settingsFile: string): void {
  const json = state.loadSettings(claudeDir, settingsFile);
  console.log(`${cctl.bold}${cctl.underline}Now Using:${cctl.reset}`);
  if (json.clautcher_activated_settings) {
    console.log(`  ${cctl.brightGreen}${json.clautcher_activated_settings}${cctl.reset}`);
  } else {
    console.log(`  ${cctl.dim}None (Not managed by clautcher yet)${cctl.reset}`);
  }
}

export function cmdTable(args: {
  cmds: Array<{ name: string; description: string }>;
  indent: string;
  maxWidth: string;
}) {
  const { cmds, indent, maxWidth } = args;
}
