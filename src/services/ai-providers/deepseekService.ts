// DeepSeek Service Implementation

interface DeepSeekResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

class DeepSeekService {
  private baseUrl = 'https://api.deepseek.com/v1';
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async generateResponse(
    message: string,
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      attachments?: any[];
    }
  ): Promise<DeepSeekResponse> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const messages = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    const requestBody = {
      model: modelId,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048,
      stream: false
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DeepSeek API request failed');
    }

    const data = await response.json();
    const usage = data.usage || {};
    
    // Calculate cost based on model pricing
    const inputCost = this.getInputCost(modelId, usage.prompt_tokens || 0);
    const outputCost = this.getOutputCost(modelId, usage.completion_tokens || 0);

    return {
      content: data.choices[0]?.message?.content || '',
      tokens: {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      },
      cost: inputCost + outputCost
    };
  }

  async *streamResponse(
    message: string,
    modelId: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const messages = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    const requestBody = {
      model: modelId,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048,
      stream: true
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DeepSeek API request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private getInputCost(modelId: string, tokens: number): number {
    const costs: Record<string, number> = {
      'deepseek-chat': 0.0000014,
      'deepseek-coder': 0.0000014
    };
    return (costs[modelId] || 0) * tokens;
  }

  private getOutputCost(modelId: string, tokens: number): number {
    const costs: Record<string, number> = {
      'deepseek-chat': 0.0000028,
      'deepseek-coder': 0.0000028
    };
    return (costs[modelId] || 0) * tokens;
  }
}

export const deepseekService = new DeepSeekService();
export default deepseekService;