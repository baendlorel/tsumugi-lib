import { mkdirSync, writeFileSync } from 'node:fs';
import { getList } from './list.js';
import { ClautcherError, state } from '../common.js';
import path from 'node:path';
import { cctl } from '../../../_shared/utils/color.js';

export function use(args: { name: string; claudeDir: string; settingsFile: string }) {
  const { name, claudeDir, settingsFile } = args;

  const files = getList(claudeDir);
  const file = files.find((p) => p.name === name);

  if (!file) {
    throw new ClautcherError(`Settings File not found: settings.${name}.json`, 'SettingsFileNotFound');
  }

  mkdirSync(claudeDir, { recursive: true });
  const content = state.loadSettings(claudeDir, file.fileName);
  content.clautcher_activated_settings = name;
  writeFileSync(path.join(claudeDir, settingsFile), JSON.stringify(content, null, 2));

  console.log(`Switched to settings: ${cctl.brightGreen}${cctl.bold}${file.fileName}${cctl.reset}`);
}

state.HelpList.push({
  command: 'use <name>',
  description: `Overwrite settings.json with settings.<name>.json. If a settings.${cctl.bold}${cctl.yellow}base${cctl.reset}.json exists, it will be merged.`,
});
