// Mistral AI Service Implementation

interface MistralResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

class MistralService {
  private baseUrl = 'https://api.mistral.ai/v1';
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
  ): Promise<MistralResponse> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not configured');
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
      throw new Error(error.error?.message || 'Mistral API request failed');
    }

    const data = await response.json();
    const usage = data.usage || {};
    
    return {
      content: data.choices[0]?.message?.content || '',
      tokens: {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      },
      cost: this.calculateCost(modelId, usage.prompt_tokens || 0, usage.completion_tokens || 0)
    };
  }

  async *streamResponse(
    message: string,
    modelId: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not configured');
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
      throw new Error(error.error?.message || 'Mistral API request failed');
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

  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'mistral-large-latest': { input: 0.000004, output: 0.000012 },
      'mistral-medium-latest': { input: 0.0000027, output: 0.0000081 },
      'mistral-small-latest': { input: 0.000001, output: 0.000003 }
    };

    const modelPricing = pricing[modelId] || { input: 0, output: 0 };
    return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  }
}

export const mistralService = new MistralService();
export default mistralService;