import { execSync } from 'node:child_process';
import { copyFileSync, renameSync } from 'node:fs';
import pkg from './package.json' with { type: 'json' };

execSync('vite build', { stdio: 'inherit' });
copyFileSync('./package.json', './dist/package.json');
copyFileSync('./src/config.json', './dist/config.json');

// 读取版本号
if (process.argv.includes('tar')) {
  const tarName = `${pkg.name}-${pkg.version}.tar`;

  // 打包为 tar
  execSync(`tar -cvf ${tarName} dist`, { stdio: 'inherit' });
  renameSync(tarName, `./dist/${tarName}`);
}

console.log(`\n打包完成: ${pkg.name}`);
