import { cctl } from '../../../_shared/utils/color.js';
import { state } from '../common.js';

export function help() {
  const rawCommands = [
    ...state.HelpList,
    {
      command: `version`,
      description: 'Show version.',
    },
    {
      command: `help`,
      description: 'Show this help message.',
    },
  ];
  const maxLen = Math.max(...rawCommands.map((v) => v.command.length));

  const HELP = [
    `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - A simple CLI tool to switch Claude settings.json.`,
    `  ${cctl.dim}${cctl.italic}If ${cctl.yellow}settings.base.json${cctl.reset}${cctl.dim}${cctl.italic} exists, it will be merged.${cctl.reset}`,
    `${cctl.underline + cctl.bold}Usage:${cctl.reset}`,
    ...rawCommands.map((v) => `  ${cctl.bold}${v.command.padEnd(maxLen)}${cctl.reset} ${v.description}`),
  ].join('\n');

  console.log(HELP);
}
