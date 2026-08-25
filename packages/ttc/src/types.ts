export type ApiInterface = 'chat' | 'responses' | 'anthropic';

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
  type: 'chat-completion' | 'responses' | 'anthropic';
}

export interface ApiError {
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}
