import { mkdirSync, writeFileSync } from 'node:fs';
import { getList } from './list.js';
import { ClautcherError, state } from '../common.js';
import path from 'node:path';
import { cctl } from '../../../_shared/utils/color.js';

export function use(name: string, claudeDir: string, settingsFile: string) {
  const profiles = getList(claudeDir);
  const profile = profiles.find((p) => p.name === name);

  if (!profile) {
    throw new ClautcherError(`Profile not found: ${name}`, 'SettingsFileNotFound');
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, profile.fileName);
  content['__clautcher_activated_settings'] = name;
  writeFileSync(path.join(claudeDir, settingsFile), JSON.stringify(content, null, 2));
  console.log(`${cctl.brightGreen}Switched to settings: ${cctl.bold}${name}${cctl.reset}`);
}

state.HelpList.push({
  command: 'use <name>',
  description: 'Overwrite the content of settings.json with settings.<name>.json.',
});
