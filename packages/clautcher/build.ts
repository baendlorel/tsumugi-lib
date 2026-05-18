import { execSync } from 'node:child_process';

execSync('pnpm exec rimraf dist', { stdio: 'inherit' });
execSync('pnpm exec tsc -p tsconfig.json', { stdio: 'inherit' });

console.log('\nBuild finished: clautcher');