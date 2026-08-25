import type {
  AnthropicResponse,
  ApiInterface,
  ApiTestResult,
  ChatCompletionResponse,
  ModelInfo,
  ModelsResponse,
  ResponsesResponse,
} from './types.js';
import { URLS } from './common.js';

const TEST_MESSAGE = '用1句话介绍自己';

async function extractApiError(response: Response, fallback: string): Promise<string> {
  let message = `HTTP ${response.status}`;
  try {
    const text = await response.text();
    message += `: ${text}`;
  } catch (e) {
    message += `: ${e instanceof Error ? e.message : String(e)}`;
  }
  return `${fallback} (${message})`;
}

function query<R extends ModelsResponse | ChatCompletionResponse | AnthropicResponse | ResponsesResponse>(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<R | string> {
  const isModelsEndpoint = url.endsWith('models');
  return fetch(url, {
    method: isModelsEndpoint ? 'GET' : 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: isModelsEndpoint ? undefined : JSON.stringify(body),
  }).then((r) => (r.ok ? r.json() : extractApiError(r, '请求失败'))) as Promise<R | string>;
}

function fail(error: string, type: ApiInterface): ApiTestResult {
  return { content: '', error, type };
}

export async function testChatCompletion(apiKey: string, model: string): Promise<ApiTestResult> {
  const data = await query<ChatCompletionResponse>(URLS.chat, apiKey, {
    model,
    messages: [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: TEST_MESSAGE },
    ],
    max_tokens: 50,
    temperature: 0.3,
    stream: false,
  });
  if (typeof data === 'string') return fail(data, 'chat');

  const content = data.choices?.[0]?.message?.content ?? '';
  return {
    content,
    error: content ? undefined : '响应格式异常：缺少 choices 字段',
    usage: data.usage,
    type: 'chat',
  };
}

export async function testResponses(apiKey: string, model: string): Promise<ApiTestResult> {
  const data = await query<ResponsesResponse>(URLS.responses, apiKey, {
    model,
    input: TEST_MESSAGE,
    max_output_tokens: 50,
  });
  if (typeof data === 'string') return fail(data, 'responses');

  let content = '';
  for (const item of data.output ?? []) {
    if (item.type === 'message') {
      for (const c of item.content ?? []) {
        if (c.type === 'output_text' && c.text) content += c.text;
      }
    }
  }
  return {
    content,
    error: content ? undefined : '响应格式异常：缺少 output 字段',
    usage: data.usage,
    type: 'responses',
  };
}

export async function testAnthropic(apiKey: string, model: string): Promise<ApiTestResult> {
  const data = await query<AnthropicResponse>(URLS.anthropic, apiKey, {
    model,
    max_tokens: 50,
    system: '你是一个有用的助手。',
    messages: [{ role: 'user', content: TEST_MESSAGE }],
  });
  if (typeof data === 'string') return fail(data, 'anthropic');

  const content = data.content?.find((c) => c.type === 'text')?.text ?? '';
  return {
    content,
    error: content ? undefined : '响应格式异常：缺少 content 字段',
    usage: data.usage,
    type: 'anthropic',
  };
}

export const TESTERS: Record<ApiInterface, (apiKey: string, model: string) => Promise<ApiTestResult>> = {
  chat: testChatCompletion,
  responses: testResponses,
  anthropic: testAnthropic,
};

export async function fetchModels(apiKey: string): Promise<{ models: ModelInfo[]; error?: string }> {
  const data = await query<ModelsResponse>(URLS.models, apiKey, {});
  if (typeof data === 'string') return { models: [], error: data };
  return { models: data.data ?? [] };
}

export function logResults(results: ApiTestResult[]): void {
  for (const result of results) {
    console.log(`[${result.type}] ${result.error ? `❌ ${result.error}` : result.content}`);
    if (result.usage) {
      const usageText = Object.entries(result.usage)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      console.log(`📦 Token 用量: ${usageText}`);
    }
  }
}
