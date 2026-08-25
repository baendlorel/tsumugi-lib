#!/usr/bin/env node

/**
 * test_api_key.ts
 * 用途：测试电信大模型网关API密钥有效性的命令行工具
 * 使用方法：npx ts-node test_api_key.ts --key YOUR_API_KEY
 */

import type { ModelInfo, ApiTestResult } from './types.js';
import { fetchModels, testChatCompletion, testResponses, testAnthropic, logResults } from './protocols.js';
import { parseArgs } from './cli.js';
import { createPrompt, promptUser } from './cli.js';

function showHelp(): void {
  console.log(`
🔑 电信大模型网关 API 密钥测试工具

用法:
  npx ts-node test_api_key.ts [选项]

选项:
  --key, -k <API_KEY>    直接指定 API 密钥（若不提供，将交互式输入）
  --help, -h             显示此帮助信息

交互流程:
  1. 输入或通过 --key 提供 API 密钥
  2. 选择要检测的接口（Chat Completions / Responses / Anthropic）
  3. 自动获取可用模型列表
  4. 选择要测试的模型
  5. 发送请求并显示结果

示例:
  npx ts-node test_api_key.ts --key sk-xxxxxx
  npx ts-node test_api_key.ts -k sk-xxxxxx
`);
}

// ============ 主程序 ============
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('\n🔑 电信大模型网关 API 密钥测试工具\n');
  console.log('='.repeat(50));

  // ----- 获取 API Key -----
  let apiKey: string;
  if (args.key) {
    apiKey = args.key;
    console.log(`✅ 使用命令行提供的 API Key: ${apiKey.substring(0, 8)}...`);
  } else {
    const rl = createPrompt();
    apiKey = await promptUser(rl, '🔑 请输入您的 API Key: ');
    rl.close();
    if (!apiKey) {
      console.error('❌ 错误: API Key 不能为空');
      process.exit(1);
    }
    console.log(`✅ 已获取 API Key: ${apiKey.substring(0, 8)}...`);
  }

  console.log('\n' + '='.repeat(50));

  // ----- 获取模型列表 -----
  console.log('\n📡 正在获取可用模型列表...');
  const modelResult = await fetchModels(apiKey);
  if (modelResult.error) {
    console.error(`❌ 获取模型列表失败: ${modelResult.error}`);
    process.exit(1);
  }

  const models = modelResult.models;
  if (models.length === 0) {
    console.error('❌ 未获取到任何可用模型');
    process.exit(1);
  }

  console.log(`✅ 获取到 ${models.length} 个可用模型:\n`);
  models.forEach((model, index) => {
    console.log(`  ${index + 1}. ${model.id}`);
  });

  console.log('\n' + '='.repeat(50));

  // ----- 选择模型 -----
  let selectedModel: string;

  // ----- 选择接口 -----
  const rl = createPrompt();
  while (true) {
    const answer = await promptUser(rl, `\n🔢 请选择要测试的模型 (1-${models.length}): `);

    const index = parseInt(answer, 10);
    if (!isNaN(index) && index >= 1 && index <= models.length) {
      selectedModel = models[index - 1].id;
      break;
    } else {
      console.log(`❌ 无效选择，请输入 1 到 ${models.length} 之间的数字`);
    }
  }
  rl.close();

  console.log(`✅ 开始测试chat-completion、responses和anthropic接口，使用模型:  ${selectedModel}`);

  const testMessage = '用1句话介绍自己';

  try {
    const startTime = Date.now();

    const all = await Promise.all([
      testChatCompletion(apiKey, selectedModel, testMessage),
      testResponses(apiKey, selectedModel, testMessage),
      testAnthropic(apiKey, selectedModel, testMessage),
    ]);

    const elapsed = Date.now() - startTime;

    console.log(`✅ 请求成功，耗时: ${elapsed}ms:`);
    logResults(all);

    console.log('\n✅ API Key 有效！测试通过 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 程序异常: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
