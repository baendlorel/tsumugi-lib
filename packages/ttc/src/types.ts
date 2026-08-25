export type ApiInterface = 'chat-completion' | 'responses' | 'anthropic';

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface ApiTestResult {
  content: string;
  usage?: Record<string, number>;
  error?: string;
  type: ApiInterface;
}

export interface ApiError {
  error?: {
    message: string;
    type: string;
    code?: string;
  };
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
