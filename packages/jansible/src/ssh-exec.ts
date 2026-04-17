import { exec } from 'node:child_process';
import { HostConfig } from './config.js';

export interface SSHExecResult {
  host: HostConfig;
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

function escapeSSHCommand(cmd: string): string {
  return "'" + cmd.replace(/'/g, "'\\''") + "'";
}

export function sshExec(host: HostConfig, cmd: string): Promise<SSHExecResult> {
  const args = ['ssh', ...host.toSSHTarget(), escapeSSHCommand(cmd)];

  return new Promise((resolve) => {
    exec(args.join(' '), (err, sdtout, stderr) => {
      if (err) {
        resolve({
          host,
          success: false,
          stdout: '',
          stderr: err.message || stderr || 'SSH连接失败',
          code: -1,
        });
      } else {
        resolve({
          host,
          success: true,
          stdout: sdtout,
          stderr: '',
          code: 0,
        });
      }
    });
  });
}
