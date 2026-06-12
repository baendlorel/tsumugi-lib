import { cctl } from '../../../_shared/utils/color.js';

const VERSION = '0.2.0';

export function help(): void {
  const helpText = `
${cctl.bold}${cctl.cyan}Total Lines __VERSION__${cctl.reset} - Count lines of code in your project

${cctl.bold}Usage:${cctl.reset}
  lines [options] [path]
    ${cctl.yellow}-v${cctl.reset}           Verbose mode (show file details)
    ${cctl.yellow}--threads${cctl.reset} <n>  Use worker threads for file counting
    ${cctl.yellow}-V${cctl.reset}           Show version number
    ${cctl.yellow}-h${cctl.reset}           Show this help message
    ${cctl.yellow}-p${cctl.reset} <path>    Count lines in the specified path (recursive)
  
  lines config           Show config file format
  lines config suffix    Show current supported file suffixes
  lines config exclude   Show current exclusion patterns
`;
  console.log(helpText);
}

export function version(): void {
  console.log(cctl.yellow + cctl.bold + `Total Lines v${VERSION}` + cctl.reset);
}
