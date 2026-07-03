import os from 'node:os';
import path from 'node:path';
import { getWindowsHomedir } from '@shared/index.js';
import { existsSync, writeFileSync } from 'node:fs';
import { settings } from '../common/index.js';
import { execSync } from 'node:child_process';

/**
 * Synchronize `windowsUserDir/.claude/settings.json` to your wsl environment.
 */
export function syncWin(): void {
  if (os.platform() === 'win32') {
    console.log('syncwin can only be used under WSL');
    return;
  }

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
    return;
  }

  const content = Object.assign(settings.load(wslpath), {
    clautcher_activated_settings: '<synchronized to windows>',
  });

  writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));
}

/**
 * Synchronize `wslUserDir/.claude/settings.json` to your Windows environment.
 */
export function syncWsl() {
  if (os.platform() !== 'win32') {
    console.log('syncwsl can only be used under Windows');
    return;
  }

  try {
    // ! There might be prefixes like `wsl: 检测到 localhost 代理配置，但未镜像到 WSL。NAT 模式下的 WSL 不支持 localhost 代理。`
    // ! We must eliminate it.
    const PLACEHOLDER = '__KASUKABE_WSL_DETECTOR__';
    const wslprefix = execSync(`wsl echo "\`"${PLACEHOLDER}\`""`, { encoding: 'utf-8', shell: 'powershell.exe' })
      .trim()
      .replace(PLACEHOLDER, '');
    const raw = execSync('wsl cat "`$HOME`/.claude/settings.json"', { encoding: 'utf-8', shell: 'powershell.exe' })
      .replace(wslprefix, '')
      .trim();

    const wslSettings = JSON.parse(raw);

    // Write to Windows settings file
    const content = Object.assign(wslSettings, {
      clautcher_activated_settings: '<synchronized from wsl>',
    });

    writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));
    console.log('Settings synchronized from WSL to Windows.');
  } catch (err) {
    console.error('Failed to sync from WSL:', err instanceof Error ? err.message : err);
  }
}
