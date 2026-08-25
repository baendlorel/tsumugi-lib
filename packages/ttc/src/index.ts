#!/usr/bin/env node

import type { ApiInterface, TestOutput } from './types.js';
import type { Command, CommandType } from './cli.js';
import { createPrompt, parseArgs, promptUser } from './cli.js';
import { URLS, DIVIDER } from './consts.js';
import { TESTERS, fetchModels, logResults, testAnthropic, testChatCompletion, testResponses } from './protocols.js';
import { showHelp } from './help.js';

const handlers = {
  models: async function ({ key }: CommandType<'models'>): Promise<void> {
    const { models, error } = await fetchModels(key);
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(JSON.stringify({ url: URLS.models, models: models.map((m) => m.id) }));
  },
  test: async function ({ key, api, model }: CommandType<'test'>): Promise<void> {
    const url = URLS[api];
    let target = model;
    let output: TestOutput = { key, model: '', content: '', valid: false, url };

    try {
      if (!target) {
        const { models, error } = await fetchModels(key);
        if (error || models.length === 0) {
          console.error(error || '未获取到任何可用模型');
          console.log(JSON.stringify(output));
          return;
        }
        target = models[0].id;
      }

      const result = await TESTERS[api](key, target);
      output = { key, model: target, content: result.content, valid: !result.error && result.content.length > 0, url };
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
      output.model = target ?? '';
    }

    console.log(JSON.stringify(output));
  },
  interactive: async function (): Promise<void> {
    console.log('\n🔑 电信大模型网关 API 密钥测试工具\n');
    console.log(DIVIDER);

    const rl = createPrompt();
    const apiKey = await promptUser(rl, '🔑 请输入您的 API Key: ');
    if (!apiKey) {
      console.error('❌ 错误: API Key 不能为空');
      process.exit(1);
    }

    console.log('\n📡 正在获取可用模型列表...');
    const { models, error } = await fetchModels(apiKey);
    if (error || models.length === 0) {
      console.error(`❌ 获取模型列表失败: ${error || '未获取到任何可用模型'}`);
      process.exit(1);
    }

    console.log(`✅ 获取到 ${models.length} 个可用模型:\n`);
    models.forEach((model, index) => console.log(`  ${index + 1}. ${model.id}`));

    let selected = '';
    while (true) {
      const answer = await promptUser(rl, `\n🔢 请选择要测试的模型 (1-${models.length}): `);
      const index = parseInt(answer, 10);
      if (!Number.isNaN(index) && index >= 1 && index <= models.length) {
        selected = models[index - 1].id;
        break;
      }
      console.log(`❌ 无效选择，请输入 1 到 ${models.length} 之间的数字`);
    }
    rl.close();

    console.log(`✅ 开始测试 chat-completion、responses 和 anthropic 接口，使用模型: ${selected}`);

    try {
      const start = Date.now();
      const results = await Promise.all([
        testChatCompletion(apiKey, selected),
        testResponses(apiKey, selected),
        testAnthropic(apiKey, selected),
      ]);
      console.log(`✅ 请求完成，耗时: ${Date.now() - start}ms:`);
      logResults(results);
      console.log('\n注：接口都是透传，如果源供应商没有对应接口（如 /anthropic、/responses），返回失败是正常的。\n');
    } catch (e) {
      console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  },
  help: showHelp,
  error: async ({ message }: CommandType<'error'>) => {
    console.log(JSON.stringify({ error: message }));
    process.exitCode = 1;
  },
};

async function main(): Promise<void> {
  const cmd = parseArgs(process.argv.slice(2));
  await handlers[cmd.kind](cmd as any);
}

main().catch((error) => {
  console.error(`\n❌ 程序异常: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
