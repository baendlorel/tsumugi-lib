import { readFileSync, readdirSync } from 'node:fs';
import path, { join } from 'node:path';

export interface ProfileSummary {
  name: string;
  filePath: string;
  isActive: boolean;
}

export function list(claudeDir: string): ProfileSummary[] {
  const activeProfile =
    JSON.parse(readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'))?.__clautcher_activated_profile ||
    '<:No Active Profile:>';

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
        filePath: join(claudeDir, entry.name),
        isActive: name === activeProfile,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}
