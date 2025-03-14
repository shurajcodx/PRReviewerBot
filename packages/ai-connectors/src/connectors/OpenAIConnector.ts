import { BaseAIConnector } from '../base/BaseAIConnector';
import axios from 'axios';

/**
 * Connector for OpenAI's API
 */
export class OpenAIConnector extends BaseAIConnector {
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';
  private model: string;
  private maxTokens: number = 4000;
  private temperature: number = 0.2;
  
  /**
   * Create a new OpenAI connector
   * @param apiKey API key for OpenAI
   * @param model OpenAI model to use (defaults to 'gpt-4o')
   */
  constructor(apiKey: string, model: string = 'gpt-4o') {
    super(apiKey);
    this.model = model;
  }
  
  /**
   * Generate a response from OpenAI
   * @param prompt Prompt to send to OpenAI
   * @returns Promise that resolves to OpenAI's response
   */
  async generateResponse(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        );
        
        return response.data.choices[0].message.content;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 429) {
            throw new Error(`OpenAI API rate limit exceeded: ${data.error?.message || 'Unknown error'}`);
          } else {
            throw new Error(`OpenAI API error (${status}): ${data.error?.message || 'Unknown error'}`);
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
  
  /**
   * Set the temperature
   * @param temperature Temperature (0-1)
   * @returns This connector instance for chaining
   */
  setTemperature(temperature: number): this {
    this.temperature = temperature;
    return this;
  }
} 