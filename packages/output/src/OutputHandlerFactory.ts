import { OutputHandler, OutputHandlerOptions } from './interfaces/OutputHandler';
import { FileOutputHandler } from './handlers/FileOutputHandler';
import { GitHubPROutputHandler } from './handlers/GitHubPROutputHandler';

/**
 * Factory for creating output handlers
 */
export class OutputHandlerFactory {
  /**
   * Create a file output handler
   * @param options Output handler options
   * @returns File output handler
   */
  static createFileOutputHandler(options: OutputHandlerOptions): OutputHandler {
    return new FileOutputHandler(options);
  }

  /**
   * Create a GitHub PR output handler
   * @param options Output handler options
   * @returns GitHub PR output handler
   */
  static createGitHubPROutputHandler(options: OutputHandlerOptions): OutputHandler {
    return new GitHubPROutputHandler(options);
  }

  /**
   * Create an output handler based on the type
   * @param type Type of output handler
   * @param options Output handler options
   * @returns Output handler
   */
  static createOutputHandler(
    type: 'file' | 'pr-comment',
    options: OutputHandlerOptions,
  ): OutputHandler {
    switch (type) {
      case 'file':
        return this.createFileOutputHandler(options);
      case 'pr-comment':
        return this.createGitHubPROutputHandler(options);
      default:
        throw new Error(`Unsupported output handler type: ${type}`);
    }
  }
}
