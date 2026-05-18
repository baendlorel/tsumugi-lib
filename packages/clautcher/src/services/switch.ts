import { mkdirSync, writeFileSync } from 'node:fs';
import { list } from './list.js';
import { state } from '../state.js';

export function switcher(profileName: string, claudeDir: string, settingsFile: string) {
  const profiles = list(claudeDir);
  const profile = profiles.find((p) => p.name === profileName);

  if (!profile) {
    throw new Error(`Profile not found: ${profileName}`);
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, profile.name);
  content.__clautcher_activated_profile = profileName;
  writeFileSync(settingsFile, JSON.stringify(content, null, 2));
  return profile;
}
