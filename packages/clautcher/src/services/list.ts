import { readdirSync } from 'node:fs';
import { settings } from '../common.js';
import { cctl } from '../../../_shared/utils/color.js';

export interface ProfileSummary {
  /**
   * File name with no prefix and suffix. For example, if the file name is `settings.work.json`, the name will be `work`.
   */
  name: string;

  /**
   * File name with prefix and suffix. For example, `settings.work.json`.
   */
  fileName: string;

  filePath: string;

  isActive: boolean;
}

export function getList(): ProfileSummary[] {
  const activeProfile = settings.load(settings.FilePath)?.clautcher_activated_settings || '<:No Active Profile:>';

  return readdirSync(settings.ClaudeDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name !== 'settings.json' &&
        entry.name !== 'settings.base.json' &&
        entry.name.startsWith('settings.') &&
        entry.name.endsWith('.json'),
    )
    .map((entry) => {
      const name = entry.name.replace(/^settings\.(.+)\.json$/, '$1');
      return {
        name,
        fileName: entry.name,
        filePath: entry.parentPath.join(entry.name),
        isActive: name === activeProfile,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function list(): ProfileSummary[] {
  const arr = getList();

  if (arr.length === 0) {
    console.log(cctl.red + 'No available settings.<name>.json found.' + cctl.reset);
  } else {
    // console.log(cctl.bold + 'Available names:' + cctl.reset);
    const maxLen = Math.max(...arr.map((v) => (v.isActive ? v.name.length + 1 : v.name.length)), 0);
    console.log(
      `${cctl.underline}${cctl.bold}Name${cctl.reset}${' '.repeat(maxLen - 4)}  ${cctl.underline}${cctl.bold}File Path${cctl.reset}`,
    );
    arr.forEach((v) => {
      if (v.isActive) {
        console.log(`${cctl.brightGreen}*${v.name}${cctl.reset}${' '.repeat(maxLen - v.name.length)} ${v.filePath}`);
      } else {
        console.log(`${v.name.padEnd(maxLen)}  ${v.filePath}`);
      }
    });
  }
  return arr;
}

settings.HelpList.push({
  command: 'list, ls',
  description: 'List all settings.<name>.json in the claude directory.',
});
