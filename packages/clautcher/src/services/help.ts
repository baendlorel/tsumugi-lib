import { cctl } from '../../../_shared/utils/color.js';
import { cmdTable, settings } from '../common/index.js';

export function help() {
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

  const HELP = [
    `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - A simple CLI tool to switch Claude settings.json.`,
    `${cctl.underline + cctl.bold}Steps:${cctl.reset}`,
    `  ${cctl.bold}1. ${cctl.reset}Enter .claude directory, create a settings.<name>.json file for each profile you want to use.`,
    `  ${cctl.bold}2. ${cctl.reset}Run \`${cctl.yellow}clautcher${cctl.reset}\` and select a profile to switch.`,
    `  ${cctl.dim}${cctl.italic}If ${cctl.yellow}settings.base.json${cctl.reset}${cctl.dim}${cctl.italic} exists, it will be merged.${cctl.reset}`,
    // `${cctl.underline + cctl.bold}Available Commands:${cctl.reset}`,
    // availableCommands,
  ].join('\n');

  console.log(HELP);
}
