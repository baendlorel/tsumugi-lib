import { writeFileSync } from 'node:fs';
import { cctl } from '../../../_shared/utils/color.js';

import { getList } from './list.js';
import { ClautcherError, settings } from '../common.js';

export function use(name: string) {
  const files = getList();
  const file = files.find((p) => p.name === name);

  if (!file) {
    throw new ClautcherError(`Settings File not found: settings.${name}.json`, 'SettingsFileNotFound');
  }

  const content = Object.assign({}, settings.loadBase(), settings.load(file.filePath), {
    clautcher_activated_settings: name,
  });

  writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));

  console.log(`Switched to settings: ${cctl.brightGreen}${cctl.bold}${file.fileName}${cctl.reset}`);
}

settings.HelpList.push({
  command: 'use <name>',
  description: `Overwrite settings.json with settings.<name>.json. If ${cctl.underline}settings.base.json${cctl.reset} exists, it will be merged.`,
});
