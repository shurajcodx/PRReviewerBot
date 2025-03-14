import { BaseAIConnector } from '../base/BaseAIConnector';
import axios from 'axios';

/**
 * Connector for Anthropic's Claude AI
 */
export class ClaudeConnector extends BaseAIConnector {
  private apiUrl: string = 'https://api.anthropic.com/v1/messages';
  private model: string;
  private maxTokens: number = 4000;
  
  /**
   * Create a new Claude connector
   * @param apiKey API key for Claude
   * @param model Claude model to use (defaults to 'claude-3-opus-20240229')
   */
  constructor(apiKey: string, model: string = 'claude-3-opus-20240229') {
    super(apiKey);
    this.model = model;
  }
  
  /**
   * Generate a response from Claude
   * @param prompt Prompt to send to Claude
   * @returns Promise that resolves to Claude's response
   */
  async generateResponse(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01'
            }
          }
        );
        
        return response.data.content[0].text;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 429) {
            throw new Error(`Claude API rate limit exceeded: ${data.error?.message || 'Unknown error'}`);
          } else {
            throw new Error(`Claude API error (${status}): ${data.error?.message || 'Unknown error'}`);
          }
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Set the maximum number of tokens
   * @param maxTokens Maximum number of tokens
   * @returns This connector instance for chaining
   */
  setMaxTokens(maxTokens: number): this {
    this.maxTokens = maxTokens;
    return this;
  }
  
  /**
   * Set the model
   * @param model Model to use
   * @returns This connector instance for chaining
   */
  setModel(model: string): this {
    this.model = model;
    return this;
  }
} 