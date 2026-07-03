import isWsl from 'is-wsl';
import { execSync } from 'node:child_process';

export const getWindowsHomedir = () => {
  if (isWsl) {
    try {
      return execSync(`powershell.exe "[Environment]::GetFolderPath('UserProfile')"`).toString().trim();
    } catch {}
  }
  return null;
};
