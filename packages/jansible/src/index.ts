import fs from 'node:fs';
import { JansibleConfig } from './config.js';
import { loadArgv } from './command.js';
import { sshExec } from './ssh-exec.js';

// 流式输出：每个主机完成后立即显示结果
async function runAll() {
  const { command, outputFile } = loadArgv();
  const hosts = new JansibleConfig().hosts;
  console.log(`\n在 ${hosts.length} 台主机上执行: ${command}\n`);
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;
  let completedCount = 0;
  const outputLines: string[] = [];
  const addOutput = (line: string) => {
    outputLines.push(line);
    if (!outputFile) {
      console.log(line);
    }
  };

  // 并发执行，但每个完成后立即输出
  await Promise.all(
    hosts.map(async (host) => {
      const result = await sshExec(host, command);

      if (result.success) {
        successCount++;
        addOutput(`【主机 ${host} 成功】\n${result.stdout}`);
      } else {
        failCount++;
        const message = result.stderr || result.stdout;
        addOutput(`【主机 ${host} 失败】(退出码: ${result.code})\n${message}`);
      }

      completedCount++;
      // 分隔线（最后一个不需要）
      if (completedCount < hosts.length) {
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
