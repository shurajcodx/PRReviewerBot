import { AIConnector } from './interfaces/AIConnector';
import { ClaudeConnector } from './connectors/ClaudeConnector';
import { OpenAIConnector } from './connectors/OpenAIConnector';
import { OllamaConnector } from './connectors/OllamaConnector';

/**
 * Factory for creating AI connectors
 */
export class AIConnectorFactory {
  /**
   * Create an AI connector based on the model name
   * @param model Model name ('claude', 'openai', or 'ollama')
   * @param apiKey API key for the AI service (not required for Ollama)
   * @param options Additional options for the connector
   * @returns AI connector instance
   */
  static createConnector(
    model: 'claude' | 'openai' | 'ollama',
    apiKey: string,
    options?: Record<string, string>,
  ): AIConnector {
    switch (model) {
      case 'claude':
        return new ClaudeConnector(apiKey);
      case 'openai':
        return new OpenAIConnector(apiKey);
      case 'ollama':
        return new OllamaConnector(apiKey, options);
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }
}
