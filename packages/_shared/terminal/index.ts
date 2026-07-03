import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import isWsl from 'is-wsl';

export const getWindowsHomedir = () => {
  if (isWsl) {
    try {
      return execSync(`powershell.exe "[Environment]::GetFolderPath('UserProfile')"`, { encoding: 'utf-8' }).trim();
    } catch {}
  }
  return null;
};

export const getWSLHomedir = () => {
  if (os.platform() !== 'win32') {
    return null;
  }

  try {
    const raw = execSync('wsl echo "`$HOME"`')
      .toString()
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => path.isAbsolute(v));

    return raw[0] ?? null;
  } catch {}
  return null;
};
