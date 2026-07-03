import { cctl } from '@shared/utils/color.js';
import { cmdTable, settings } from '../common/index.js';
// TODO help要更新新东西。直接运行的时候如果是sync过的也要有提示。
export function help(options?: { noProfilesYet: boolean }) {
  const rawCommands = [
    ...settings.HelpList,
    {
      command: `version`,
      description: 'Show version.',
    },
    {
      command: `cur`,
      description: 'Show which settings.<name>.json is being used.',
    },
    {
      command: `help`,
      description: 'Show this help message.',
    },
  ];

  const availableCommands = cmdTable({
    cmds: rawCommands.map((command) => ({
      name: command.command,
      description: command.description,
    })),
    indent: 2,
    maxWidth: 60,
  });

  const ClautcherIntro = `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - A simple CLI tool to switch Claude's settings.json.`;
  const NoAvailableProfilesYet = `You don't have any settings.<name>.json file in your Claude directory yet. Please create one to continue.`;

  const firstLine = options?.noProfilesYet ? NoAvailableProfilesYet : ClautcherIntro;
  const HELP = [
    firstLine,
    `${cctl.underline + cctl.bold}Steps:${cctl.reset}`,
    `  ${cctl.bold}1. ${cctl.reset}Enter .claude directory, create a settings.<name>.json file.`,
    `  ${cctl.bold}2. ${cctl.reset}Run \`${cctl.yellow}clautcher${cctl.reset}\` and select a name.`,
    `${cctl.underline + cctl.bold}Note:${cctl.reset}`,
    `  If ${cctl.yellow}settings.base.json${cctl.reset} exists, it will be used as a common part.${cctl.reset}`,
    // `${cctl.italic}${cctl.underline + cctl.bold}Available Commands:${cctl.reset}`,
    // availableCommands,
  ].join('\n');

  console.log(HELP);
}
