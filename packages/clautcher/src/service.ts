import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { state } from './state.js';

export interface ProfileSummary {
  name: string;
  filePath: string;
  isActive: boolean;
}

export function listProfiles(claudeDir: string): ProfileSummary[] {
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

export function switchProfile(profileName: string, claudeDir?: string) {
  const profiles = listProfiles(state.claudeDir);
  const profile = profiles.find((p) => p.name === profileName);

  if (!profile) {
    throw new Error(`Profile not found: ${profileName}`);
  }

  mkdirSync(state.claudeDir, { recursive: true });
  const content = readFileSync(profile.filePath);
  writeFileSync(state.settingsFile, content);

  return profile;
}
