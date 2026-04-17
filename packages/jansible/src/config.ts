import fs from 'node:fs';
import type { HostConfigPlain } from './types.js';

export class HostConfig implements HostConfigPlain {
  ip: string;
  user: string;
  port: string;
  password: string;
  constructor(plain: HostConfigPlain) {
    this.ip = plain.ip;
    this.user = plain.user;
    this.port = plain.port;
    this.password = plain.password;
  }

  toPlain(): HostConfigPlain {
    return {
      ip: this.ip,
      user: this.user,
      port: this.port,
      password: this.password,
    };
  }

  toSSHTarget(): string[] {
    const args: string[] = [];

    if (this.port) {
      args.push('-p', this.port);
    }

    const userHost = this.user ? `${this.user}@${this.ip}` : this.ip;
    args.push(userHost);

    return args;
  }

  /** 返回主机的可读标识 */
  toString(): string {
    const parts: string[] = [];
    if (this.port) {
      parts.push(`端口${this.port}`);
    }
    if (this.user) {
      parts.push(this.user);
    }
    parts.push(this.ip);
    return parts.join(' ');
  }
}

class JansibleConfig {
  /**
   * 主机列表
   */
  readonly hosts: HostConfig[];

  constructor() {
    this.hosts = this.loadHosts();
  }

  private loadHosts(): HostConfig[] {
    const raw = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    if (!Array.isArray(raw.hosts)) {
      throw new Error('Invalid hosts configuration. Must be an Array');
    }
    if (raw.hosts.some((host: HostConfigPlain) => typeof host?.ip !== 'string')) {
      throw new Error(
        'Invalid hosts configuration. Must be Array<{ ip: string; user?: string; port?: string; password?: string }>',
      );
    }

    const common = Object(raw.common);
    return raw.hosts.map((h: HostConfigPlain) => {
      return new HostConfig({
        ip: h.ip,
        user: h.user ?? common.user ?? '',
        port: h.port ?? common.port ?? '',
        password: h.password ?? common.password ?? '',
      });
    });
  }
}

export const config = new JansibleConfig();
