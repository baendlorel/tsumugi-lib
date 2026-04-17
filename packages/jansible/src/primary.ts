import fs from 'node:fs';
import cluster from 'node:cluster';
import { HostConfig, JansibleConfig } from './config.js';
import { loadArgv } from './command.js';
import type { HostConfigPlain } from './types.d.js';

interface OutputBuffer {
  lines: string[];
  count: number;
  total: number;
}

interface Counters {
  succ: number;
  fail: number;
}

/**
 * 主进程运行逻辑
 */
export function runPrimary(): void {
  const { command, outputFile } = loadArgv();
  const hosts = new JansibleConfig().hosts;

  console.log(`\n在 ${hosts.length} 台主机上执行: ${command}\n`);
  console.log('='.repeat(60));

  // 输出缓冲区
  const outputBuffer: OutputBuffer = { lines: [], count: 0, total: hosts.length };
  const counters: Counters = {
    succ: 0,
    fail: 0,
  };
  let isCompleted = false;

  // 转换 hosts 为可序列化格式
  const hostsPlain: HostConfigPlain[] = hosts.map((h) => h.toPlain());

  // 创建 Worker
  const worker = cluster.fork();

  // Worker 错误处理
  worker.on('error', (err) => {
    console.error(`Worker 错误: ${err.message}`);
    process.exit(1);
  });

  // Worker 退出处理
  worker.on('exit', (code, signal) => {
    if (!isCompleted && code !== 0) {
      console.error(`Worker 异常退出: code=${code}, signal=${signal}`);
      process.exit(1);
    }
  });

  // 监听 Worker 消息
  worker.on('message', (msg) => {
    if (msg.type === 'progress') {
      handleProgress(msg, outputBuffer, counters);
    } else if (msg.type === 'complete') {
      handleComplete(msg, outputBuffer, outputFile, counters);
      isCompleted = true;
    }
  });

  // 发送任务给 Worker
  worker.send({
    type: 'tasks',
    payload: {
      hosts: hostsPlain,
      command,
    },
  });
}

/**
 * 处理进度消息（每个 SSH 完成时触发）
 */
function handleProgress(
  msg: Extract<import('./types.d.js').WorkerToPrimaryMessage, { type: 'progress' }>,
  buffer: OutputBuffer,
  counters: Counters,
): void {
  const { payload } = msg;
  buffer.count++;

  // 更新计数器
  if (payload.success) {
    counters.succ++;
  } else {
    counters.fail++;
  }

  // 实例化 HostConfig 用于格式化显示
  const hostConfig = new HostConfig(payload.host);
  const prefix = `\n【主机 ${hostConfig.toString()}】`;

  // 立即输出到终端
  if (payload.success) {
    process.stdout.write(`${prefix} 成功\n`);
    if (payload.stdout) {
      process.stdout.write(payload.stdout);
    }
  } else {
    process.stdout.write(`${prefix} 失败 (退出码: ${payload.code})\n`);
    const message = payload.stderr || payload.stdout;
    if (message) {
      process.stdout.write(message);
    }
  }

  // 添加到缓冲区（用于保存到文件）
  buffer.lines.push(prefix);
  if (payload.success) {
    buffer.lines.push(payload.stdout);
  } else {
    buffer.lines.push(`失败 (退出码: ${payload.code})`);
    buffer.lines.push(payload.stderr || payload.stdout);
  }

  // 添加分隔线（最后一个除外）
  if (buffer.count < buffer.total) {
    buffer.lines.push('-'.repeat(60));
    process.stdout.write('-'.repeat(60) + '\n');
  }
}

/**
 * 处理完成消息（所有任务完成时触发）
 */
function handleComplete(
  _msg: Extract<import('./types.d.js').WorkerToPrimaryMessage, { type: 'complete' }>,
  buffer: OutputBuffer,
  outputFile: string | null,
  counters: Counters,
): void {
  console.log('='.repeat(60));
  console.log(`\n总计: ${counters.succ} 成功, ${counters.fail} 失败\n`);

  // 保存到文件
  if (outputFile) {
    fs.writeFileSync(outputFile, buffer.lines.join('\n'), 'utf-8');
    console.log(`结果已保存到: ${outputFile}\n`);
  }

  // 关闭 Worker
  cluster.disconnect(() => {
    process.exit(0);
  });
}
