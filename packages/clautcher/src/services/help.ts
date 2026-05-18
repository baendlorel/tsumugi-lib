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
    'Clautcher __VERSION__ - A simple CLI tool to switch Claude settings.json.',
    'Usage:',
    ...rawCommands.map((v) => `  ${v.command.padEnd(maxLen)} : ${v.description}`),
  ].join('\n');

  console.log(HELP);
}
