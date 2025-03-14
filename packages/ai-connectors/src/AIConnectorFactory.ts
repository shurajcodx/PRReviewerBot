import { AIConnector } from './interfaces/AIConnector';
import { ClaudeConnector } from './connectors/ClaudeConnector';
import { OpenAIConnector } from './connectors/OpenAIConnector';

/**
 * Factory for creating AI connectors
 */
export class AIConnectorFactory {
  /**
   * Create an AI connector based on the model name
   * @param model Model name ('claude' or 'openai')
   * @param apiKey API key for the AI service
   * @returns AI connector instance
   */
  static createConnector(model: 'claude' | 'openai', apiKey: string): AIConnector {
    switch (model) {
      case 'claude':
        return new ClaudeConnector(apiKey);
      case 'openai':
        return new OpenAIConnector(apiKey);
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }
} 