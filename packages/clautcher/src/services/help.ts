import { cctl } from '../../../_shared/utils/color.js';
import { settings } from '../common.js';
import { cmdTable } from './common.js';

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

  const HELP = [
    `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - A simple CLI tool to switch Claude settings.json.`,
    // `  ${cctl.dim}${cctl.italic}If ${cctl.yellow}settings.base.json${cctl.reset}${cctl.dim}${cctl.italic} exists, it will be merged.${cctl.reset}`,
    `${cctl.underline + cctl.bold}Usage:${cctl.reset}`,
    cmdTable({
      cmds: rawCommands.map((command) => ({
        name: command.command,
        description: command.description,
      })),
      indent: 2,
      maxWidth: 60,
    }),
  ].join('\n');

  console.log(HELP);
}
