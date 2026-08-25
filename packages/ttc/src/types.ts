export type ApiInterface = 'chat' | 'responses' | 'anthropic';

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
  content: string;
  error?: string;
  usage?: Record<string, number>;
  type: ApiInterface;
}

export interface TestOutput {
  key: string;
  model: string;
  content: string;
  valid: boolean;
  url: string;
}

export interface ChatCompletionResponse {
  choices?: Array<{ message: { content: string } }>;
  usage?: Record<string, number>;
}

export interface ResponsesResponse {
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  usage?: Record<string, number>;
}

export interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: Record<string, number>;
}
