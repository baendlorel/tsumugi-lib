import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function loadPackageJson() {
  const paths = [
    path.resolve('package.json'),
    path.resolve('..', 'package.json'),
    path.resolve('..', '..', 'package.json'),
  ];

  const p = paths.find((p) => existsSync(p));
  if (!p) {
    console.error('没有找到 package.json 文件');
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

export const pkg = loadPackageJson();
