import { existsSync, readFileSync } from 'node:fs';

function loadPackageJson() {
  const paths = [
    new URL(/* @vite-ignore */ './package.json', import.meta.url),
    new URL(/* @vite-ignore */ '../package.json', import.meta.url),
  ];

  const p = paths.find((candidate) => existsSync(candidate));
  if (!p) {
    console.error('没有找到 package.json 文件');
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

export const pkg = loadPackageJson();
