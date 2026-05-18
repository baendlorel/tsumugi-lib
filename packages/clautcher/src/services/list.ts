import { readdirSync } from 'node:fs';
import path from 'node:path';
import { state } from '../state.js';

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

export function getList(claudeDir: string): ProfileSummary[] {
  const activeProfile =
    state.loadSettings(claudeDir, state.SettingsFile)?.['__clautcher_activated_profile'] || '<:No Active Profile:>';

  return readdirSync(claudeDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name !== 'settings.json' &&
        entry.name.startsWith('settings.') &&
        entry.name.endsWith('.json'),
    )
    .map((entry) => {
      const name = entry.name.replace(/^settings\.(.+)\.json$/, '$1');
      return {
        name,
        fileName: entry.name,
        filePath: path.join(claudeDir, entry.name),
        isActive: name === activeProfile,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function list(claudeDir: string): ProfileSummary[] {
  const arr = getList(claudeDir);

  if (arr.length === 0) {
    console.log('No available settings.<name>.json found.');
  } else {
    console.log('Available names:');
    const maxLen = Math.max(...arr.map((v) => v.name.length), 0);
    arr.forEach((v) => {
      console.log(`${v.isActive ? '  [Active] ' : '  '}${v.name.padEnd(maxLen)} - ${v.filePath}`);
    });
  }
  return arr;
}

state.HelpList.push({
  command: 'list',
  description: 'List all available settings in the claude directory.',
});
