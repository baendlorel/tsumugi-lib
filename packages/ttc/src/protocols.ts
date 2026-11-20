import type {
  AnthropicResponse,
  ApiInterface,
  ApiTestResult,
  ChatCompletionResponse,
  ModelInfo,
  ModelsResponse,
  ResponsesResponse,
} from './types.js';
import { URLS, flattenUsage, getElapsed } from './common.js';
import { API_TYPES } from './types.js';

const TEST_MESSAGE = '用1句话介绍自己';
const DEFAULT_MAX_OUTPUT_TOKENS = 300;
/** 网关偶尔会挂起连接，超时后直接判失败而不是无限等待 */
const REQUEST_TIMEOUT_MS = 60_000;

interface QueryResult<R> {
  data?: R;
  error?: string;
  /** 原始响应，仅在失败时保留 */
  raw?: unknown;
}

function errorOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 从任意 JSON 响应里尽量捞出一条可读的错误信息 */
function errorMessageOf(payload: unknown): string {
  if (payload === null || typeof payload !== 'object') return String(payload);
  const obj = payload as Record<string, unknown>;
  const nested = obj.error;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof nested === 'string') return nested;
  if (nested && typeof nested === 'object' && typeof (nested as any).message === 'string') {
    return (nested as any).message;
  }
  return JSON.stringify(payload);
}

function usageOf(payload: unknown): Record<string, number> | undefined {
  if (payload === null || typeof payload !== 'object') return undefined;
  const usage = (payload as Record<string, unknown>).usage;
  return usage && typeof usage === 'object' ? (usage as Record<string, number>) : undefined;
}

async function query<R extends ModelsResponse | ChatCompletionResponse | AnthropicResponse | ResponsesResponse>(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<QueryResult<R>> {
  const isModelsEndpoint = url.endsWith('models');

  let response: Response;
  try {
    response = await fetch(url, {
      method: isModelsEndpoint ? 'GET' : 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: isModelsEndpoint ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    return { error: `网络请求失败: ${errorOf(e)}` };
  }

  const text = await response.text().catch(() => '');
  let parsed: unknown;
  let isJson = false;
  if (text) {
    try {
      parsed = JSON.parse(text);
      isJson = true;
    } catch {
      // 非 JSON，保留原文
    }
  }

  if (!response.ok) {
    const detail = isJson ? errorMessageOf(parsed) : text;
    return {
      error: `HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
      raw: isJson ? parsed : text || undefined,
    };
  }

  if (!isJson) {
    return {
      error: '响应格式异常：响应不是合法 JSON',
      raw: text || undefined,
    };
  }

  return { data: parsed as R };
}

function fail(error: string, type: ApiInterface, raw?: unknown): ApiTestResult {
  return { type, valid: false, content: '', error, raw, usage: usageOf(raw), elapsed: 0 };
}

function succeed(content: string, type: ApiInterface, usage?: Record<string, number>): ApiTestResult {
  return { type, valid: true, content, usage, elapsed: 0 };
}

export async function testChatCompletion(apiKey: string, model: string): Promise<ApiTestResult> {
  const { data, error, raw } = await query<ChatCompletionResponse>(URLS.chat, apiKey, {
    model,
    messages: [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: TEST_MESSAGE },
    ],
    max_tokens: 50,
    temperature: 0.3,
    stream: false,
  });
  if (!data) return fail(error!, 'chat', raw);

  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) return fail('响应格式异常：缺少 choices[0].message.content 字段', 'chat', data);
  return succeed(content, 'chat', data.usage);
}

export async function testResponses(apiKey: string, model: string): Promise<ApiTestResult> {
  const { data, error, raw } = await query<ResponsesResponse>(URLS.responses, apiKey, {
    model,
    input: TEST_MESSAGE,
    max_output_tokens: maxOutputTokens(),
  });
  if (!data) return fail(error!, 'responses', raw);

  let content = '';
  for (const item of data.output ?? []) {
    if (item.type === 'message') {
      for (const c of item.content ?? []) {
        if (c.type === 'output_text' && c.text) content += c.text;
      }
    }
  }
  if (!content) return fail('响应格式异常：缺少 output 字段', 'responses', data);
  return succeed(content, 'responses', data.usage);
}

export async function testAnthropic(apiKey: string, model: string): Promise<ApiTestResult> {
  const { data, error, raw } = await query<AnthropicResponse>(URLS.anthropic, apiKey, {
    model,
    max_tokens: 50,
    system: '你是一个有用的助手。',
    messages: [{ role: 'user', content: TEST_MESSAGE }],
  });
  if (!data) return fail(error!, 'anthropic', raw);

  const content = data.content?.find((c) => c.type === 'text')?.text ?? '';
  if (!content) return fail('响应格式异常：缺少 content 字段', 'anthropic', data);
  return succeed(content, 'anthropic', data.usage);
}

function maxOutputTokens(): number {
  const raw = process.env.TTC_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === '') return DEFAULT_MAX_OUTPUT_TOKENS;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_OUTPUT_TOKENS;
}

const TESTERS: Record<ApiInterface, (apiKey: string, model: string) => Promise<ApiTestResult>> = {
  chat: testChatCompletion,
  responses: testResponses,
  anthropic: testAnthropic,
};

/** 执行一次协议测试，并记录耗时。调用方无需自行计时。 */
export async function runTest(api: ApiInterface, apiKey: string, model: string): Promise<ApiTestResult> {
  const start = performance.now();
  let result: ApiTestResult;
  try {
    result = await TESTERS[api](apiKey, model);
  } catch (e) {
    result = fail(errorOf(e), api);
  }
  result.elapsed = getElapsed(start);
  return result;
}

/** 并行执行全部协议测试，结果顺序固定为 chat → responses → anthropic。 */
export function runAllTests(apiKey: string, model: string): Promise<ApiTestResult[]> {
  return Promise.all(API_TYPES.map((api) => runTest(api, apiKey, model)));
}

export async function fetchModels(apiKey: string): Promise<{ models: ModelInfo[]; error?: string }> {
  const { data, error } = await query<ModelsResponse>(URLS.models, apiKey, {});
  if (!data) return { models: [], error };
  return { models: data.data ?? [] };
}

/**
 * 打印一组测试结果。
 * 每个接口占一个区块（空行分隔），Token 用量行带 [接口名] 前缀，
 * 正常返回的接口在标签后加 ✅；格式异常时附上完整原始响应用于排查。
 */
export function logResults(results: ApiTestResult[]): void {
  for (const result of results) {
    const label = `[${result.type}]`;
    console.log(result.valid ? `${label} ✅ ${result.content}` : `${label} ❌ ${result.error}`);

    if (result.usage && Object.keys(result.usage).length > 0) {
      console.log(`${label} 📦 Token 用量: ${flattenUsage(result.usage).join(', ')}`);
    }

    if (result.raw !== undefined) {
      const rawText = typeof result.raw === 'string' ? result.raw : JSON.stringify(result.raw);
      console.log(`📄 ${label} 原始响应: ${rawText}`);
    }

    console.log();
  }
}

/** 输出最终结论，例如「chat、responses 可用」。 */
export function logSummary(results: ApiTestResult[]): void {
  const available = results.filter((r) => r.valid).map((r) => `[${r.type}]`);
  const unavailable = results.filter((r) => !r.valid).map((r) => `[${r.type}]`);

  console.log('─'.repeat(50));
  console.log(available.length > 0 ? `✅ 可用: ${available.join('、')}` : '❌ 无可用接口');
  if (unavailable.length > 0) console.log(`❌ 不可用: ${unavailable.join('、')}`);
}
