import { spawn } from 'node:child_process';
import { HostConfig } from './config.js';

export interface SSHExecResult {
  host: HostConfig;
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

export function sshExec(host: HostConfig, cmd: string): Promise<SSHExecResult> {
  return new Promise((resolve) => {
    const child = spawn('ssh', [...host.toSSHTarget(), cmd]);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      resolve({
        host,
        success: false,
        stdout,
        stderr: stderr || err.message || 'SSH连接失败',
        code: -1,
      });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({
          host,
          success: false,
          stdout,
          stderr,
          code: code ?? -1,
        });
        return;
      }

      resolve({
        host,
        success: true,
        stdout,
        stderr,
        code: 0,
      });
    });
  });
}
