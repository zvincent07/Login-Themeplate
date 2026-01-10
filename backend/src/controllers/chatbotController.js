const asyncHandler = require('../middleware/asyncHandler');

/**
 * Chatbot endpoint - Uses AI API to generate responses
 * Supports OpenAI, Anthropic Claude, and Groq (FREE)
 */
const chatWithBot = asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
    });
  }

  // Get AI provider from environment (default: groq for free tier)
  const aiProvider = process.env.AI_PROVIDER || 'groq';
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey || apiKey === 'your-ai-api-key') {
    return res.json({
      success: true,
      response: "I'm currently being set up. Please configure your AI API key in the environment variables. For now, here's a helpful response: If you're having trouble logging in, please check your email and password. You can also use the 'Forgot password?' link to reset your password.",
    });
  }

  try {
    let aiResponse;

    if (aiProvider === 'openai') {
      aiResponse = await callOpenAI(message, conversationHistory, apiKey);
    } else if (aiProvider === 'anthropic') {
      aiResponse = await callAnthropic(message, conversationHistory, apiKey);
    } else if (aiProvider === 'groq') {
      aiResponse = await callGroq(message, conversationHistory, apiKey);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported AI provider: ${aiProvider}. Supported providers: openai, anthropic, groq`,
      });
    }

    res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Call OpenAI API
 */
async function callOpenAI(message, conversationHistory, apiKey) {
  const https = require('https');

  // Build conversation context
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
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: messages,
    temperature: 0.7,
    max_tokens: 300,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
          if (result.error) {
            reject(new Error(result.error.message || 'OpenAI API error'));
          } else if (result.choices && result.choices[0] && result.choices[0].message) {
            resolve(result.choices[0].message.content.trim());
          } else {
            reject(new Error('Unexpected response format from OpenAI'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`OpenAI API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(message, conversationHistory, apiKey) {
  const https = require('https');

  // Build conversation context
  const systemPrompt = `You are a helpful support assistant for a login/authentication system. 
Help users with:
- Login issues
- Password reset
- Account creation
- General questions about the platform

Be friendly, concise, and helpful. Keep responses under 200 words.`;

  const postData = JSON.stringify({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
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

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
          if (result.error) {
            reject(new Error(result.error.message || 'Anthropic API error'));
          } else if (result.content && result.content[0] && result.content[0].text) {
            resolve(result.content[0].text.trim());
          } else {
            reject(new Error('Unexpected response format from Anthropic'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Anthropic response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Anthropic API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Call Groq API (FREE TIER AVAILABLE)
 * Groq offers free API access with generous rate limits
 */
async function callGroq(message, conversationHistory, apiKey) {
  const https = require('https');

  // Build conversation context
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
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: messages,
    temperature: 0.7,
    max_tokens: 300,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
          if (result.error) {
            reject(new Error(result.error.message || 'Groq API error'));
          } else if (result.choices && result.choices[0] && result.choices[0].message) {
            resolve(result.choices[0].message.content.trim());
          } else {
            reject(new Error('Unexpected response format from Groq'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Groq response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Groq API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  chatWithBot,
};
