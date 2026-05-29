import { cctl } from '../../../_shared/utils/color.js';

const VERSION = '0.1.0';

export function help(): void {
  const helpText = `
${cctl.bold}${cctl.cyan}How Many Lines __VERSION__${cctl.reset} - Count lines of code in your project

${cctl.bold}Usage:${cctl.reset}
  lines [options] [path]
    ${cctl.yellow}-v${cctl.reset}           Show version number
    ${cctl.yellow}-h${cctl.reset}           Show this help message
    ${cctl.yellow}-p${cctl.reset} <path>    Count lines in the specified path (recursive)

${cctl.bold}Configuration Commands:${cctl.reset}
  lines config suffix    Show current supported file suffixes (comma-separated)
  lines config exclude   Show current exclusion patterns (line-separated)

${cctl.bold}Configuration:${cctl.reset}
  Config file: ~/.how-many-lines.json
  Config Format:
    {
      "suffix": [".ts", ".js", ...],
      "exclude": ["**/node_modules", ".git", ...]
    }
`;
  console.log(helpText);
}

export function version(): void {
  console.log(cctl.yellow + cctl.bold + `How Many Lines v${VERSION}` + cctl.reset);
}
