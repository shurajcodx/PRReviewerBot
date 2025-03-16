import { AIConnector } from '../interfaces/AIConnector';

/**
 * Base class for AI connectors with common functionality
 */
export abstract class BaseAIConnector implements AIConnector {
  protected apiKey: string;
  protected maxRetries: number = 3;
  protected retryDelay: number = 1000; // milliseconds

  /**
   * Create a new base AI connector
   * @param apiKey API key
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a response from the AI
   * @param prompt Prompt to send to the AI
   * @returns AI response
   */
  abstract generateResponse(prompt: string): Promise<string>;

  /**
   * Execute a function with retries
   * @param fn Function to execute
   * @param retries Number of retries
   * @param delay Delay between retries in milliseconds
   * @returns Result of the function
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries,
    delay: number = this.retryDelay,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      console.warn(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);

      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry with exponential backoff
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Set the maximum number of retries
   * @param maxRetries Maximum number of retries
   */
  setMaxRetries(maxRetries: number): void {
    this.maxRetries = maxRetries;
  }

  /**
   * Set the delay between retries
   * @param retryDelay Delay in milliseconds
   */
  setRetryDelay(retryDelay: number): void {
    this.retryDelay = retryDelay;
  }
}
