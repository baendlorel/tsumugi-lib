import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { list } from './list.js';

export function switchSettings(profileName: string, claudeDir: string, settingsFile: string) {
  const profiles = list(claudeDir);
  const profile = profiles.find((p) => p.name === profileName);

  if (!profile) {
    throw new Error(`Profile not found: ${profileName}`);
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = readFileSync(profile.filePath);
  writeFileSync(settingsFile, content);

  return profile;
}
