import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { getPackageInfo } from './common/package-info.js';

export async function lint(who: string | undefined) {
  const info = getPackageInfo(who);
  const dir = join(import.meta.dirname, '..', '.oxlintrc.json');
  execSync(`oxlint -c ${dir}`, { cwd: info.path, stdio: 'inherit', env: info.env });
}
