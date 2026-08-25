import type { ApiError, ApiTestResult, ModelInfo, ModelsResponse } from './types.js';
import { CONFIG } from './config.js';

export async function testChatCompletion(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.chat}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是一个有用的助手。' },
        { role: 'user', content: testMessage },
      ],
      max_tokens: 50,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractApiError(response, '聊天请求失败'));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message: { content: string } }>;
    usage?: Record<string, number>;
  };

  if (data.choices && data.choices.length > 0) {
    return { content: data.choices[0].message.content, usage: data.usage, type: 'chat-completion' };
  }
  throw new Error('响应格式异常：缺少 choices 字段');
}

export async function testResponses(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.responses}`;
  const requestBody = {
    model,
    input: testMessage,
    max_output_tokens: 50,
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
    throw new Error(await extractApiError(response, 'Responses 请求失败'));
  }

  const data = (await response.json()) as {
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    usage?: Record<string, number>;
  };

  let content = '';
  for (const item of data.output ?? []) {
    if (item.type === 'message') {
      for (const c of item.content ?? []) {
        if (c.type === 'output_text' && c.text) {
          content += c.text;
        }
      }
    }
  }

  if (!content) {
    throw new Error('响应格式异常：缺少 output 字段');
  }
  return { content, usage: data.usage, type: 'responses' };
}

export async function testAnthropic(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.anthropic}`;
  const requestBody = {
    model,
    max_tokens: 50,
    system: '你是一个有用的助手。',
    messages: [{ role: 'user', content: testMessage }],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(await extractApiError(response, 'Anthropic 请求失败'));
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: Record<string, number>;
  };

  const text = data.content?.find((c) => c.type === 'text')?.text;

  if (!text) {
    throw new Error('响应格式异常：缺少 content 字段');
  }
  return { content: text, usage: data.usage, type: 'anthropic' };
}

async function extractApiError(response: Response, fallback: string): Promise<string> {
  let message = `HTTP ${response.status}`;
  try {
    const data = (await response.json()) as ApiError;
    if (data.error?.message) {
      message += `: ${data.error.message}`;
    }
  } catch {
    // ignore parse error
  }
  return `${fallback} (${message})`;
}

export async function fetchModels(apiKey: string): Promise<ModelInfo[]> {
  const url = `${CONFIG.baseURL}${CONFIG.endpoints.models}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await extractApiError(response, '获取模型列表失败'));
  }

  const data = (await response.json()) as ModelsResponse;
  return data.data || [];
}

function logResults(results: ApiTestResult[]): void {
  results.forEach((result) => {
    console.log(`[${result.type}] ${result.content}`);
    if (result.usage) {
      const usageText = Object.entries(result.usage)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      console.log(`📦 Token 用量: ${usageText}`);
    }
  });
}
