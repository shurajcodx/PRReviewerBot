import axios from 'axios';
import { BaseAIConnector } from '../base/BaseAIConnector';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Connector for Ollama API
 * Ollama is a self-hosted, open-source AI model server
 */
export class OllamaConnector extends BaseAIConnector {
  private baseUrl: string;
  private model: string;

  /**
   * Creates a new Ollama connector
   * @param apiKey Not required for Ollama, but kept for interface consistency
   * @param options Configuration options
   * @param options.baseUrl Base URL for Ollama API (default: http://localhost:11434)
   * @param options.model Model to use (default: llama2)
   */
  constructor(
    apiKey: string,
    options: {
      baseUrl?: string;
      model?: string;
    } = {},
  ) {
    super(apiKey);
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.model = options.model || 'llama3.2';
  }

  /**
   * Generate a response from the Ollama API
   * @param prompt The prompt to send to the API
   * @returns The generated response
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.withRetry(() => this.makeRequest(prompt));
      return response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      return `Error: Failed to generate response from Ollama. ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Make a request to the Ollama API
   * @param prompt The prompt to send to the API
   * @returns The generated response
   */
  private async makeRequest(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;

    const response = await axios.post<OllamaResponse>(
      url,
      {
        model: this.model,
        prompt: prompt,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.response;
  }
}
