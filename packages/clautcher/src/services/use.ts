import { mkdirSync, writeFileSync } from 'node:fs';
import { getList } from './list.js';
import { state } from '../state.js';
import path from 'node:path';

export function use(name: string, claudeDir: string, settingsFile: string) {
  const profiles = getList(claudeDir);
  const profile = profiles.find((p) => p.name === name);

  if (!profile) {
    throw new Error(`Profile not found: ${name}`);
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, profile.fileName);
  content.__clautcher_activated_profile = name;
  writeFileSync(path.join(claudeDir, settingsFile), JSON.stringify(content, null, 2));
  console.log(`Switched to settings: ${name}`);
}

state.HelpList.push({
  command: 'use <name>',
  description: 'Overwrite the content of settings.json with settings.<name>.json.',
});
