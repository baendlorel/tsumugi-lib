import { execSync } from 'node:child_process';
import { getPackageInfo } from './common/package-info.js';

export async function skill(who: string | undefined) {
  const info = getPackageInfo(who);
  const skillScript = info.json.scripts?.skill;
  console.log(`Skill script for ${info.name}: ${skillScript ? skillScript : 'No skill script defined.'}`);
  if (typeof skillScript === 'string') {
    execSync('pnpm skill', { stdio: 'inherit', cwd: info.path, env: info.env });
  }
}
