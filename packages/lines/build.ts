import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import ts from 'typescript';

const packageDir = import.meta.dirname;
const workspaceRoot = path.resolve(packageDir, '..', '..');
const workerSourcePath = path.join(packageDir, 'src', 'services', 'counter-worker.ts');
const workerOutputPath = path.join(packageDir, 'dist', 'counter-worker.mjs');

execSync('pnpm exec rollup -c rollup.config.ts --configPlugin typescript', {
  stdio: 'inherit',
  cwd: workspaceRoot,
  env: process.env,
});

const workerSource = readFileSync(workerSourcePath, 'utf-8');
const transpiledWorker = ts.transpileModule(workerSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
  fileName: 'counter-worker.ts',
});

mkdirSync(path.dirname(workerOutputPath), { recursive: true });
writeFileSync(workerOutputPath, transpiledWorker.outputText, 'utf-8');
