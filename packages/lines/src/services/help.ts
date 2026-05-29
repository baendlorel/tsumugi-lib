import { cctl } from '@shared/utils/color.js';

const VERSION = '0.1.0';

export function help(): void {
  const helpText = `
${cctl.bold}${cctl.cyan}How Many Lines${cctl.reset} - Count lines of code in your project

${cctl.bold}Usage:${cctl.reset}
  lines [options] [path]

${cctl.bold}Options:${cctl.reset}
  ${cctl.yellow}-v${cctl.reset}           Show version number
  ${cctl.yellow}-h${cctl.reset}           Show this help message
  ${cctl.yellow}-p${cctl.reset} <path>    Count lines in the specified path (recursive)

${cctl.bold}Examples:${cctl.reset}
  ${cctl.green}lines .${cctl.reset}              Count lines in current directory
  ${cctl.green}lines -p /path/to/project${cctl.reset}  Count lines in specified path
  ${cctl.green}lines -v${cctl.reset}             Show version

${cctl.bold}Configuration:${cctl.reset}
  Config file: ~/.how-many-lines.json
  Will be created automatically if it doesn't exist

${cctl.bold}Config Format:${cctl.reset}
  {
    "suffix": [".ts", ".js", ...],
    "exclude": ["node_modules", ".git", ...]
  }

${cctl.bold}Report bugs:${cctl.reset}
  https://github.com/baendlorel/tsumugi-lib/issues
`;
  console.log(helpText);
}

export function version(): void {
  console.log(cctl.yellow + cctl.bold + `How Many Lines v${VERSION}` + cctl.reset);
}
