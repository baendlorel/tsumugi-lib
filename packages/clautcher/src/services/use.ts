import { mkdirSync, writeFileSync } from 'node:fs';
import { getList } from './list.js';
import { ClautcherError, state } from '../common.js';
import path from 'node:path';
import { cctl } from '../../../_shared/utils/color.js';

export function use(name: string, claudeDir: string, settingsFile: string) {
  const files = getList(claudeDir);
  const file = files.find((p) => p.name === name);

  if (!file) {
    throw new ClautcherError(`Settings File not found: settings.${name}.json`, 'SettingsFileNotFound');
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, file.fileName);
  content['__clautcher_activated_settings'] = name;
  writeFileSync(path.join(claudeDir, settingsFile), JSON.stringify(content, null, 2));
  console.log(`Switched to settings: ${cctl.brightGreen}${cctl.bold}${file.fileName}${cctl.reset}`);
}

state.HelpList.push({
  command: 'use <name>',
  description: 'Overwrite the content of settings.json with settings.<name>.json.',
});
