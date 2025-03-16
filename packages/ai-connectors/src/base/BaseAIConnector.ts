import { AIConnector } from '../interfaces/AIConnector';
import axios, { AxiosError } from 'axios';

/**
 * Base class for AI connectors with common functionality
 */
export abstract class BaseAIConnector implements AIConnector {
  protected apiKey: string;
  protected maxRetries: number = 3;
  protected retryDelay: number = 1000; // ms

  /**
   * Create a new base AI connector
   * @param apiKey API key for the AI service
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a response from the AI
   * @param prompt Prompt to send to the AI
   * @returns Promise that resolves to the AI's response
   */
  abstract generateResponse(prompt: string): Promise<string>;

  /**
   * Set the maximum number of retries
   * @param maxRetries Maximum number of retries
   * @returns This connector instance for chaining
   */
  setMaxRetries(maxRetries: number): this {
    this.maxRetries = maxRetries;
    return this;
  }

  /**
   * Set the delay between retries
   * @param retryDelay Delay between retries in milliseconds
   * @returns This connector instance for chaining
   */
  setRetryDelay(retryDelay: number): this {
    this.retryDelay = retryDelay;
    return this;
  }

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @returns Promise that resolves to the function's result
   */
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if it's a rate limit error (status code 429)
        if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 429) {
          console.warn(
            `Rate limit exceeded, retrying in ${this.retryDelay}ms (attempt ${attempt + 1}/${this.maxRetries})`,
          );
          await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }

        // For other errors, only retry if we have attempts left
        if (attempt < this.maxRetries - 1) {
          console.warn(
            `Error occurred, retrying in ${this.retryDelay}ms (attempt ${attempt + 1}/${this.maxRetries}): ${error}`,
          );
          await this.delay(this.retryDelay);
          continue;
        }

        // If we've exhausted all retries, throw the error
        throw error;
      }
    }

    // This should never happen, but TypeScript requires it
    throw lastError || new Error('Unknown error occurred during retry');
  }

  /**
   * Delay execution for a specified time
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
