import { mkdirSync, writeFileSync } from 'node:fs';
import { list } from './list.js';
import { state } from '../state.js';

export function use(profileName: string, claudeDir: string, settingsFile: string) {
  const profiles = list(claudeDir);
  const profile = profiles.find((p) => p.name === profileName);

  if (!profile) {
    throw new Error(`Profile not found: ${profileName}`);
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, profile.fileName);
  content.__clautcher_activated_profile = profileName;
  writeFileSync(settingsFile, JSON.stringify(content, null, 2));
  return profile;
}

state.HelpList.push({
  command: 'use <name>',
  description: 'Overwrite the content of settings.json with settings.<name>.json.',
});
