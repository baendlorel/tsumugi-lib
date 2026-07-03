import { cctl } from '@shared/utils/color.js';

// TODO help要更新新东西。直接运行的时候如果是sync过的也要有提示。
export function help(options?: { noProfilesYet: boolean }) {
  const ClautcherIntro = `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - A simple CLI tool to switch Claude's settings.json.`;
  const NoAvailableProfilesYet = `You don't have any settings.<name>.json file in your Claude directory yet. Please create one to continue.`;

  const firstLine = options?.noProfilesYet ? NoAvailableProfilesYet : ClautcherIntro;
  const HELP = [
    firstLine,
    `${cctl.underline + cctl.bold}Commands:${cctl.reset}`,
    `  ${cctl.bold}use <name>${cctl.reset}      Switch to settings.<name>.json`,
    `  ${cctl.bold}list${cctl.reset}          List all available profiles`,
    `  ${cctl.bold}current${cctl.reset}       Show current active profile`,
    `  ${cctl.bold}syncwin${cctl.reset}       Sync from WSL to Windows`,
    `  ${cctl.bold}syncwsl${cctl.reset}       Sync from Windows to WSL`,
    `  ${cctl.bold}help${cctl.reset}          Show this help message`,
    `  ${cctl.bold}version${cctl.reset}       Show version`,
    '',
    `${cctl.underline + cctl.bold}Steps:${cctl.reset}`,
    `  ${cctl.bold}1. ${cctl.reset}Enter .claude directory, create a settings.<name>.json file.`,
    `  ${cctl.bold}2. ${cctl.reset}Run \`${cctl.yellow}clautcher${cctl.reset}\` and select a name.`,
    `${cctl.underline + cctl.bold}Note:${cctl.reset}`,
    `  If ${cctl.yellow}settings.base.json${cctl.reset} exists, it will be used as a common part.${cctl.reset}`,
  ].join('\n');

  console.log(HELP);
}
