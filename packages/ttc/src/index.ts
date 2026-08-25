#!/usr/bin/env node

/**
 * test_api_key.ts
 * 用途：测试电信大模型网关API密钥有效性的命令行工具
 * 使用方法：npx ts-node test_api_key.ts --key YOUR_API_KEY
 */

import * as readline from 'readline';

// ============ 配置 ============
const CONFIG = {
  baseURL: 'https://aigw.telecomjs.com/v1',
  endpoints: {
    chat: '/chat/completions',
    models: '/models',
  },
};

// ============ 类型定义 ============
interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ApiError {
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

// ============ 命令行参数解析 ============
interface CliArgs {
  key: string | null;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { key: null, help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--key' || arg === '-k') {
      if (i + 1 < args.length) {
        result.key = args[++i];
      }
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }

  return result;
}

// ============ 交互式输入 ============
function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function promptUser(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// ============ API 调用函数 ============
async function fetchModels(apiKey: string): Promise<ModelInfo[]> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.models}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = (await response.json()) as ApiError;
      if (errorData.error?.message) {
        errorMsg += `: ${errorData.error.message}`;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(`获取模型列表失败 (${errorMsg})`);
  }

  const data = (await response.json()) as ModelsResponse;
  return data.data || [];
}

async function testChatCompletion(
  apiKey: string,
  model: string,
  testMessage: string,
): Promise<{ success: boolean; content: string; usage?: ChatCompletionResponse['usage'] }> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.chat}`;

  const requestBody: ChatCompletionRequest = {
    model,
    messages: [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: testMessage },
    ],
    max_tokens: 50,
    temperature: 0.3,
    stream: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = (await response.json()) as ApiError;
      if (errorData.error?.message) {
        errorMsg += `: ${errorData.error.message}`;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(`聊天请求失败 (${errorMsg})`);
  }

  const data = (await response.json()) as ChatCompletionResponse;

  if (data.choices && data.choices.length > 0) {
    return {
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  } else {
    throw new Error('响应格式异常：缺少 choices 字段');
  }
}

// ============ 显示帮助信息 ============
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
  2. 自动获取可用模型列表
  3. 选择要测试的模型
  4. 输入测试消息（或使用默认消息）
  5. 发送请求并显示结果

示例:
  npx ts-node test_api_key.ts --key sk-xxxxxx
  npx ts-node test_api_key.ts -k sk-xxxxxx
`);
}

// ============ 主程序 ============
async function main(): Promise<void> {
  const args = parseArgs();

  // 显示帮助
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
  let models: ModelInfo[];
  try {
    models = await fetchModels(apiKey);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    console.error('💡 请检查 API Key 是否正确，以及网络是否正常');
    process.exit(1);
  }

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
  const rl = createPrompt();
  let selectedModel: string;

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

  console.log(`✅ 已选择模型: ${selectedModel}`);

  // ----- 输入测试消息 -----
  const defaultMessage = '请用一句话介绍你自己';
  console.log(`\n💬 测试消息 (直接回车使用默认消息):`);
  console.log(`   默认: "${defaultMessage}"`);

  rl.close();

  console.log('\n' + '='.repeat(50));
  console.log('\n🚀 正在发送测试请求...\n');

  // ----- 发送测试请求 -----
  try {
    const startTime = Date.now();
    const result = await testChatCompletion(apiKey, selectedModel, '你好');
    const elapsed = Date.now() - startTime;

    console.log('✅ 请求成功！\n');
    console.log(`📊 响应内容:`);
    console.log(`   ${result.content}`);
    console.log(`\n⏱️  耗时: ${elapsed}ms`);

    console.log('\n✅ API Key 有效！测试通过 🎉\n');
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 程序异常: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
