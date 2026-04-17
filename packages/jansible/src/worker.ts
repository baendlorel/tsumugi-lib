import process from 'node:process';
import type { PrimaryToWorkerMessage, ProgressMessage, CompleteMessage } from './types.d.js';
import { HostConfig } from './config.js';
import { sshExec } from './ssh-exec.js';

/**
 * Worker 进程入口
 */
export function runWorker(): void {
  process.on('message', async (msg: PrimaryToWorkerMessage) => {
    if (msg.type === 'tasks') {
      await handleTasks(msg.payload);
    }
  });
}

/**
 * 处理任务列表
 */
async function handleTasks(payload: PrimaryToWorkerMessage['payload']): Promise<void> {
  const { hosts, command } = payload;

  let successCount = 0;
  let failCount = 0;
  const total = hosts.length;

  // 并发执行所有 SSH 任务
  await Promise.all(
    hosts.map(async (hostPlain) => {
      const host = new HostConfig(hostPlain);
      const result = await sshExec(host, command);

      // 统计
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // 每个 spawn 结束立即通知主进程
      const progressMsg: ProgressMessage = {
        type: 'progress',
        payload: {
          host: hostPlain,
          success: result.success,
          stdout: result.stdout,
          stderr: result.stderr,
          code: result.code,
        },
      };
      process.send!(progressMsg);
    }),
  );

  // 所有任务完成，发送完成消息
  const completeMsg: CompleteMessage = {
    type: 'complete',
    payload: {
      total,
      successCount,
      failCount,
    },
  };
  process.send!(completeMsg);
}

// 启动 Worker
runWorker();
