import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPackageInfo } from './common/package-info.js';

export async function build(who: string | undefined) {
  const info = getPackageInfo(who);
  if (existsSync(join(info.path, 'build.ts'))) {
    execSync('pnpm exec tsx build.ts', { stdio: 'inherit', cwd: info.path, env: info.env });
    return;
  }
  execSync(`rollup -c rollup.config.ts --configPlugin typescript`, { stdio: 'inherit', env: info.env });
}
