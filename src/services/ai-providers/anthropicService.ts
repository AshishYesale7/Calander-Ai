// Anthropic Claude Service Implementation

interface AnthropicResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

class AnthropicService {
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
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
  ): Promise<AnthropicResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const requestBody: any = {
      model: modelId,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
      messages: []
    };

    if (options?.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    // Handle attachments (images)
    if (options?.attachments && options.attachments.length > 0) {
      const content = [{ type: 'text', text: message }];
      
      for (const attachment of options.attachments) {
        if (attachment.type.startsWith('image/')) {
          // Convert image to base64 if needed
          const base64Data = attachment.data || attachment.url;
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: attachment.type,
              data: base64Data
            }
          });
        }
      }
      
      requestBody.messages.push({
        role: 'user',
        content
      });
    } else {
      requestBody.messages.push({
        role: 'user',
        content: message
      });
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
    }

    const data = await response.json();
    const usage = data.usage || {};
    
    // Calculate cost based on model pricing
    const inputCost = this.getInputCost(modelId, usage.input_tokens || 0);
    const outputCost = this.getOutputCost(modelId, usage.output_tokens || 0);

    return {
      content: data.content[0]?.text || '',
      tokens: {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
        total: (usage.input_tokens || 0) + (usage.output_tokens || 0)
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
      throw new Error('Anthropic API key not configured');
    }

    const requestBody: any = {
      model: modelId,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
      stream: true,
      messages: [{
        role: 'user',
        content: message
      }]
    };

    if (options?.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
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
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text;
                if (content) {
                  yield content;
                }
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
      'claude-3-5-sonnet-20241022': 0.000003,
      'claude-3-haiku-20240307': 0.00000025,
      'claude-3-opus-20240229': 0.000015
    };
    return (costs[modelId] || 0) * tokens;
  }

  private getOutputCost(modelId: string, tokens: number): number {
    const costs: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 0.000015,
      'claude-3-haiku-20240307': 0.00000125,
      'claude-3-opus-20240229': 0.000075
    };
    return (costs[modelId] || 0) * tokens;
  }
}

export const anthropicService = new AnthropicService();
export default anthropicService;