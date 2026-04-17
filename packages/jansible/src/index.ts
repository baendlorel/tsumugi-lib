import fs from 'node:fs';
import { JansibleConfig } from './config.js';
import { loadArgv } from './command.js';
import { sshExec, type SSHExecResult } from './ssh-exec.js';

async function sequentially(
  hosts: JansibleConfig['hosts'],
  command: string,
  onResult: (result: SSHExecResult, isLast: boolean) => void,
) {
  let completedCount = 0;
  await Promise.all(
    hosts.map(async (host) => {
      const result = await sshExec(host, command);
      completedCount++;
      onResult(result, completedCount === hosts.length);
    }),
  );
}

async function concurrently(
  hosts: JansibleConfig['hosts'],
  command: string,
  onResult: (result: SSHExecResult, isLast: boolean) => void,
) {
  for (let i = 0; i < hosts.length; i++) {
    const result = await sshExec(hosts[i], command);
    onResult(result, i === hosts.length - 1);
  }
}

async function runAll() {
  const { command, outputFile, sequential } = loadArgv();
  const hosts = new JansibleConfig().hosts;
  console.log(`\n在 ${hosts.length} 台主机上执行: ${command}\n`);
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;
  const outputLines: string[] = [];
  const addOutput = (line: string) => {
    outputLines.push(line);
    if (!outputFile) {
      console.log(line);
    }
  };

  const onResult = (result: SSHExecResult, isLast: boolean) => {
    if (result.success) {
      successCount++;
      addOutput(`【主机 ${result.host} 成功】\n${result.stdout}`);
    } else {
      failCount++;
      const message = result.stderr || result.stdout;
      addOutput(`【主机 ${result.host} 失败】(退出码: ${result.code})\n${message}`);
    }

    if (!isLast) {
      addOutput('-'.repeat(60));
    }
  };

  if (sequential) {
    await concurrently(hosts, command, onResult);
  } else {
    await sequentially(hosts, command, onResult);
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf-8');
    console.log(`结果已保存到: ${outputFile}\n`);
  } else {
    console.log('='.repeat(60));
  }

  console.log(`\n总计: ${successCount} 成功, ${failCount} 失败\n`);
}

runAll();
