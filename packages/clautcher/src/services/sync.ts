import os from 'node:os';
import path from 'node:path';
import { getWindowsHomedir, getWSLHomedir } from '@shared/index.js';
import { existsSync, writeFileSync } from 'node:fs';
import { settings } from '../common/index.js';
import { execSync } from 'node:child_process';

/**
 * Synchronize `windowsUserDir/.claude/settings.json` to your wsl environment.
 */
export function syncWin() {
  if (os.platform() === 'win32') {
    console.log('syncwin can only be used under WSL');
    return null;
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

  // ! There might be prefixes like `wsl: 检测到 localhost 代理配置，但未镜像到 WSL。NAT 模式下的 WSL 不支持 localhost 代理。`
  // ! We must eliminate it.
  const PLACEHOLDER = '__KASUKABE_WSL_DETECTOR__';
  const wslprefix = execSync(`wsl echo "\`"${PLACEHOLDER}\`""`, { encoding: 'utf-8' }).trim().replace(PLACEHOLDER, '');
  const raw = execSync('wsl cat "`$HOME`/.claude/settings.json"', { encoding: 'utf-8' }).replace(wslprefix, '').trim();

  const wslSettings = JSON.parse(raw);

  // Write to Windows settings file
  const content = Object.assign(wslSettings, {
    clautcher_activated_settings: '<synchronized from wsl>',
  });

  writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));
  console.log('Settings synchronized from WSL to Windows.');
}
// FIXME 重大异常如下：
//  clautcher syncwsl
// wsl: �hKm0R localhost �NtM�n
//                             �FO*g\��P0R WSL0NAT !j_
// N/ec localhost �Nt0                                N�v WSL
// /bin/bash: -c: line 1: unexpected EOF while looking for matching `"'
// Error: Command failed: wsl echo "`"__KASUKABE_WSL_DETECTOR__`""
// wsl: �hKm0R localhost �NtM�n
//                             �FO*g\��P0R WSL0NAT !j_
// N/ec localhost �Nt0                                N�v WSL
// /bin/bash: -c: line 1: unexpected EOF while looking for matching `"'

//     at genericNodeError (node:internal/errors:985:15)
//     at wrappedFn (node:internal/errors:539:14)
//     at checkExecSyncError (node:child_process:925:11)
//     at execSync (node:child_process:997:15)
//     at N (file:///C:/Users/80652/AppData/Roaming/npm/node_modules/clautcher/dist/index.mjs:5:2628)
//     at P (file:///C:/Users/80652/AppData/Roaming/npm/node_modules/clautcher/dist/index.mjs:5:3197)
//     at file:///C:/Users/80652/AppData/Roaming/npm/node_modules/clautcher/dist/index.mjs:5:3374
//     at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
//     at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:661:26)
//     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
//   status: 2,
//   signal: null,
//   output: [
//     null,
//     '',
//     'w\x00s\x00l\x00:\x00 \x00�hKm0R \x00l\x00o\x00c\x00a\x00l\x00h\x00o\x00s\x00t\x00 \x00�N\x06tM�n\x7F\f�FO*g\\��P0R \x00W\x00S\x00L\x00\x020N\x00A\x00T\x00 \x00!j\x0F_\x0BN�v \x00W\x00S\x00L\x00 \x00\rN/e\x01c \x00l\x00o\x00c\x00a\x00l\x00h\x00o\x00s\x00t\x00 \x00�N\x06t\x020\r\x00\n' +
//       '\x00/bin/bash: -c: line 1: unexpected EOF while looking for matching `"\'\n'
//   ],
//   pid: 11768,
//   stdout: '',
//   stderr: 'w\x00s\x00l\x00:\x00 \x00�hKm0R \x00l\x00o\x00c\x00a\x00l\x00h\x00o\x00s\x00t\x00 \x00�N\x06tM�n\x7F\f�FO*g\\��P0R \x00W\x00S\x00L\x00\x020N\x00A\x00T\x00 \x00!j\x0F_\x0BN�v \x00W\x00S\x00L\x00 \x00\rN/e\x01c \x00l\x00o\x00c\x00a\x00l\x00h\x00o\x00s\x00t\x00 \x00�N\x06t\x020\r\x00\n' +
//     '\x00/bin/bash: -c: line 1: unexpected EOF while looking for matching `"\'\n'
// }
