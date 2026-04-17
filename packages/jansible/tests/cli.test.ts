import { chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');
const tempDirs: string[] = [];

function makeFixture(sshScript: string) {
  const dir = mkdtempSync(path.join(tmpdir(), 'jansible-'));
  tempDirs.push(dir);
  cpSync(distDir, dir, { recursive: true });
  mkdirSync(path.join(dir, 'bin'));
  writeFileSync(path.join(dir, 'bin', 'ssh'), sshScript);
  chmodSync(path.join(dir, 'bin', 'ssh'), 0o755);
  return dir;
}

beforeAll(() => {
  const result = spawnSync('pnpm', ['-C', rootDir, 'build'], {
    cwd: path.resolve(rootDir, '..', '..'),
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'build failed');
  }
});

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('jansible cli', () => {
  it('runs from another cwd and keeps spaces in command', () => {
    const dir = makeFixture(`#!/usr/bin/env bash
printf 'SSH_ARGS:%s\n' "$*"
`);

    const result = spawnSync('node', [path.join(dir, 'jansible.js'), '-e', 'echo hello world'], {
      cwd: tmpdir(),
      env: {
        ...process.env,
        PATH: `${path.join(dir, 'bin')}:${process.env.PATH ?? ''}`,
      },
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('在 2 台主机上执行: echo hello world');
    expect(result.stdout).toContain('SSH_ARGS:-p 22022 root@132.239.38.151 echo hello world');
    expect(result.stdout).toContain('SSH_ARGS:-p 22022 root@132.239.38.152 echo hello world');
  });

  it('writes command output to file', () => {
    const dir = makeFixture(`#!/usr/bin/env bash
printf 'FILE_SSH:%s\n' "$*"
`);
    const outputFile = path.join(dir, 'result.txt');

    const result = spawnSync(
      'node',
      [path.join(dir, 'jansible.js'), '-o', outputFile, '-e', 'echo hi'],
      {
        cwd: tmpdir(),
        env: {
          ...process.env,
          PATH: `${path.join(dir, 'bin')}:${process.env.PATH ?? ''}`,
        },
        encoding: 'utf-8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`结果已保存到: ${outputFile}`);
    expect(readFileSync(outputFile, 'utf-8')).toContain('FILE_SSH:-p 22022 root@132.239.38.151 echo hi');
  });

  it('shows stderr and exit code when ssh fails', () => {
    const dir = makeFixture(`#!/usr/bin/env bash
echo 'permission denied' >&2
exit 23
`);

    const result = spawnSync('node', [path.join(dir, 'jansible.js'), '-e', 'echo fail'], {
      cwd: tmpdir(),
      env: {
        ...process.env,
        PATH: `${path.join(dir, 'bin')}:${process.env.PATH ?? ''}`,
      },
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('失败】(退出码: 23)');
    expect(result.stdout).toContain('permission denied');
    expect(result.stdout).toContain('总计: 0 成功, 2 失败');
  });
});
