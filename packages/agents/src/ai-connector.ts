/**
 * Interface for AI connectors
 */
export interface AIConnector {
  /**
   * Generate a response from the AI
   * @param prompt Prompt to send to the AI
   * @returns AI response
   */
  generateResponse(prompt: string): Promise<string>;
} 