import type {
  AnthropicResponse,
  ChatCompletionResponse,
  ResponsesResponse,
  ApiTestResult,
  ModelInfo,
  ModelsResponse,
  ApiInterface,
} from './types.js';
import { URLS } from './config.js';
import { verbose } from './cli.js';

async function extractApiError(response: Response, fallback: string): Promise<string> {
  let message = `HTTP ${response.status}`;
  try {
    const data = await response.text();
    message += `: ${data}`;
  } catch (e) {
    if (e instanceof Error) {
      message += `: ${e.message}`;
    } else if (typeof e === 'string') {
      message += `: ${e}`;
    } else {
      message += `: ${String(e)}`;
    }
    // is not valid JSON
  }
  return `${fallback} (${message})`;
}

function query<R extends ModelsResponse | ChatCompletionResponse | AnthropicResponse | ResponsesResponse>(
  url: string,
  apiKey: string,
  body: any,
) {
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
// verbose && console.log('[chat-completion]', data);

function err(data: string, type: ApiInterface) {
  return {
    content: '',
    error: data,
    type,
  };
}

export async function testChatCompletion(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const data = await query<ChatCompletionResponse>(URLS.chat, apiKey, {
    model,
    messages: [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: testMessage },
    ],
    max_tokens: 50,
    temperature: 0.3,
    stream: false,
  });
  if (typeof data === 'string') {
    return err(data, 'chat-completion');
  }

  if (data.choices && data.choices.length > 0) {
    return { content: data.choices[0].message.content, usage: data.usage, type: 'chat-completion' };
  } else {
    verbose && console.log('[chat-completion]', data);
    return {
      content: '',
      error: '响应格式异常：缺少 choices 字段',
      type: 'chat-completion',
    };
  }
}

export async function testResponses(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const data = await query<ResponsesResponse>(URLS.responses, apiKey, {
    model,
    input: testMessage,
    max_output_tokens: 50,
  });
  if (typeof data === 'string') {
    return err(data, 'responses');
  }

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
    verbose && console.log('[responses]', data);
    return { content: '响应格式异常：缺少 output 字段', usage: data.usage, type: 'responses' };
  }
  return { content, usage: data.usage ?? {}, type: 'responses' };
}

export async function testAnthropic(apiKey: string, model: string, testMessage: string): Promise<ApiTestResult> {
  const data = await query<AnthropicResponse>(URLS.anthropic, apiKey, {
    model,
    max_tokens: 50,
    system: '你是一个有用的助手。',
    messages: [{ role: 'user', content: testMessage }],
  });
  if (typeof data === 'string') {
    return err(data, 'anthropic');
  }

  const text = data.content?.find((c) => c.type === 'text')?.text;

  if (!text) {
    verbose && console.log('[anthropic]', data);
    return { content: '响应格式异常：缺少 content 字段', usage: data.usage, type: 'anthropic' };
  }
  return { content: text, usage: data.usage, type: 'anthropic' };
}

export async function fetchModels(apiKey: string): Promise<{ models: ModelInfo[]; error: string }> {
  const data = await query<ModelsResponse>(URLS.models, apiKey, {});
  if (typeof data === 'string') {
    return { models: [], error: data };
  }
  return { models: data.data || [], error: '' };
}

export function logResults(results: ApiTestResult[]): void {
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
