import fs from 'node:fs';
import { config } from './config.js';
import { loadArgv } from './command.js';
import { sshExec, type SSHExecResult } from './ssh-exec.js';

// 流式输出：每个主机完成后立即显示结果
async function runAll() {
  const hosts = config.hosts;
  const { command, outputFile } = loadArgv();
  console.log(`\n在 ${hosts.length} 台主机上执行: ${command}\n`);
  console.log('='.repeat(60));

  const results: SSHExecResult[] = [];
  let successCount = 0;
  let failCount = 0;
  const outputLines: string[] = [];
  const addOutput = (line: string) => {
    outputLines.push(line);
    if (!outputFile) {
      console.log(line);
    }
  };

  // 并发执行，但每个完成后立即输出
  await Promise.all(
    hosts.map(async (host, index) => {
      const result = await sshExec(host, command);
      results.push(result);

      // 立即输出当前主机结果
      const prefix = `\n【主机 ${host}】`;

      if (result.success) {
        successCount++;
        addOutput(`【主机 ${host} 成功】\n${result.stdout}`);
      } else {
        failCount++;
        const message = result.stderr || result.stdout;
        addOutput(`【主机 ${host} 失败】(退出码: ${result.code})\n${message}`);
        if (message) {
          process.stdout.write(message);
        }
      }

      // 分隔线（最后一个不需要）
      if (index < hosts.length - 1) {
        addOutput('-'.repeat(60));
      }
    }),
  );

  if (outputFile) {
    fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf-8');
    console.log(`结果已保存到: ${outputFile}\n`);
  } else {
    console.log('='.repeat(60));
  }

  console.log(`\n总计: ${successCount} 成功, ${failCount} 失败\n`);
}

runAll();
