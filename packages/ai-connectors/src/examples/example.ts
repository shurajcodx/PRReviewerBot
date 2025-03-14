import { AIConnectorFactory } from '../AIConnectorFactory';

/**
 * Example of how to use the AI connectors
 */
async function main() {
  // Get API keys from environment variables
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!claudeApiKey && !openaiApiKey) {
    console.error('No API keys found. Please set CLAUDE_API_KEY or OPENAI_API_KEY environment variables.');
    process.exit(1);
  }

  // Sample code to analyze
  const codeToAnalyze = `
function calculateSum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}
  `;

  // Create a prompt for the AI
  const prompt = `
Analyze the following JavaScript function and provide feedback on code quality, potential bugs, and optimization opportunities.
Return your response in JSON format with the following structure:
{
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description of the issue",
      "severity": "CRITICAL|ERROR|WARNING|INFO",
      "type": "SECURITY|BUG|OPTIMIZATION|STYLE|OTHER",
      "suggestedFix": "Code suggestion to fix the issue"
    }
  ]
}

Here's the code:

${codeToAnalyze}
  `;

  // Try Claude first if API key is available
  if (claudeApiKey) {
    try {
      console.log('Using Claude connector...');
      const claudeConnector = AIConnectorFactory.createConnector('claude', claudeApiKey);
      
      const claudeResponse = await claudeConnector.generateResponse(prompt);
      console.log('Claude response:');
      console.log(claudeResponse);
    } catch (error) {
      console.error('Error with Claude connector:', error);
    }
  }
  
  // Try OpenAI if API key is available
  if (openaiApiKey) {
    try {
      console.log('\nUsing OpenAI connector...');
      const openaiConnector = AIConnectorFactory.createConnector('openai', openaiApiKey);
      
      const openaiResponse = await openaiConnector.generateResponse(prompt);
      console.log('OpenAI response:');
      console.log(openaiResponse);
    } catch (error) {
      console.error('Error with OpenAI connector:', error);
    }
  }
}

// Run the example
main().catch(error => {
  console.error('Error running example:', error);
}); 