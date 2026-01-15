/**
 * CHATBOT SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Coordinate external APIs
 */

const https = require('https');
const config = require('../config');

class ChatbotService {
  /**
   * Chat with AI bot
   */
  async chatWithBot(message, conversationHistory = []) {
    if (!message || !message.trim()) {
      const error = new Error('Message is required');
      error.statusCode = 400;
      throw error;
    }

    const aiProvider = config.aiProvider || 'groq';
    const apiKey = config.aiApiKey;

    if (!apiKey || apiKey === 'your-ai-api-key') {
      return "I'm currently being set up. Please configure your AI API key in the environment variables. For now, here's a helpful response: If you're having trouble logging in, please check your email and password. You can also use the 'Forgot password?' link to reset your password.";
    }

    let aiResponse;

    if (aiProvider === 'openai') {
      aiResponse = await this.callOpenAI(message, conversationHistory, apiKey);
    } else if (aiProvider === 'anthropic') {
      aiResponse = await this.callAnthropic(message, conversationHistory, apiKey);
    } else if (aiProvider === 'groq') {
      aiResponse = await this.callGroq(message, conversationHistory, apiKey);
    } else {
      const error = new Error(
        `Unsupported AI provider: ${aiProvider}. Supported providers: openai, anthropic, groq`
      );
      error.statusCode = 400;
      throw error;
    }

    return aiResponse;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(message, conversationHistory, apiKey) {
    const systemPrompt = `You are a helpful support assistant for a login/authentication system. 
Help users with:
- Login issues
- Password reset
- Account creation
- General questions about the platform

Be friendly, concise, and helpful. Keep responses under 200 words.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: message },
    ];

    const postData = JSON.stringify({
      model: config.openaiModel || 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return this.makeHTTPSRequest({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      postData,
      responseParser: (result) => {
        if (result.error) {
          throw new Error(result.error.message || 'OpenAI API error');
        }
        if (result.choices && result.choices[0] && result.choices[0].message) {
          return result.choices[0].message.content.trim();
        }
        throw new Error('Unexpected response format from OpenAI');
      },
    });
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(message, conversationHistory, apiKey) {
    const systemPrompt = `You are a helpful support assistant for a login/authentication system. 
Help users with:
- Login issues
- Password reset
- Account creation
- General questions about the platform

Be friendly, concise, and helpful. Keep responses under 200 words.`;

    const postData = JSON.stringify({
      model: config.anthropicModel || 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...conversationHistory.slice(-10).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        { role: 'user', content: message },
      ],
    });

    return this.makeHTTPSRequest({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      postData,
      responseParser: (result) => {
        if (result.error) {
          throw new Error(result.error.message || 'Anthropic API error');
        }
        if (result.content && result.content[0] && result.content[0].text) {
          return result.content[0].text.trim();
        }
        throw new Error('Unexpected response format from Anthropic');
      },
    });
  }

  /**
   * Call Groq API (FREE TIER AVAILABLE)
   */
  async callGroq(message, conversationHistory, apiKey) {
    const systemPrompt = `You are a helpful support assistant for a login/authentication system. 
Help users with:
- Login issues
- Password reset
- Account creation
- General questions about the platform

Be friendly, concise, and helpful. Keep responses under 200 words.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: message },
    ];

    const postData = JSON.stringify({
      model: config.groqModel || 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return this.makeHTTPSRequest({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      postData,
      responseParser: (result) => {
        if (result.error) {
          throw new Error(result.error.message || 'Groq API error');
        }
        if (result.choices && result.choices[0] && result.choices[0].message) {
          return result.choices[0].message.content.trim();
        }
        throw new Error('Unexpected response format from Groq');
      },
    });
  }

  /**
   * Make HTTPS request helper
   */
  makeHTTPSRequest({ hostname, path, headers, postData, responseParser }) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        port: 443,
        path,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(responseParser(result));
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`API request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = new ChatbotService();
