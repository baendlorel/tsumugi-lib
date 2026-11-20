export type ApiInterface = 'chat' | 'responses' | 'anthropic';

export const API_TYPES: readonly ApiInterface[] = ['chat', 'responses', 'anthropic'];

export const API_LABELS: Record<ApiInterface, string> = {
  chat: 'chat',
  responses: 'responses',
  anthropic: 'anthropic',
};

export interface ModelInfo {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  object?: string;
  data?: ModelInfo[];
}

export interface ApiTestResult {
  /** 接口类型 */
  type: ApiInterface;
  /** 请求是否成功（网络层 + 协议结构均正常） */
  valid: boolean;
  /** 提取到的回复文本，失败时为空字符串 */
  content: string;
  /** 失败原因，成功时缺省 */
  error?: string;
  /** 原始响应 JSON，仅在响应格式异常时保留，供排查 */
  raw?: unknown;
  /** Token 用量，成功时一般都有 */
  usage?: Record<string, number>;
  /** 请求耗时（毫秒） */
  elapsed: number;
}

export interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: Record<string, number>;
}

export interface ResponsesResponse {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: Record<string, number>;
}

export interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: Record<string, number>;
}
