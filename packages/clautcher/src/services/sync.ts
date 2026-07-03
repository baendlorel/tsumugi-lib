import path from 'node:path';
import { getWindowsHomedir } from '@shared/index.js';
import { existsSync, writeFileSync } from 'node:fs';
import { settings } from '../common/index.js';

/**
 * Synchronize `windowsUserDir/.claude/settings.json` to your wsl environment.
 */
export function syncWin() {
  const dir = getWindowsHomedir();
  if (!dir) {
    console.log('Not running in WSL or Windows home directory not found.');
    return;
  }

  const winpath = dir.split(path.win32.sep);
  const disk = winpath[0].replace(':', '').toLowerCase();
  const wslpath = path.posix.join('/', 'mnt', disk, ...winpath.slice(1), '.claude', 'settings.json');
  if (!existsSync(wslpath)) {
    console.log('WSL settings file not found. Path:', wslpath);
  }

  const content = Object.assign(settings.load(wslpath), {
    clautcher_activated_settings: '<synchronized to windows>',
  });

  writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));
}
