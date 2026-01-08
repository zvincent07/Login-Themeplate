const https = require('https');

/**
 * Verify Cloudflare Turnstile token
 * @param {string} token - The Turnstile token from the frontend
 * @param {string} secretKey - The Turnstile secret key
 * @param {string} remoteip - Optional: The user's IP address
 * @returns {Promise<boolean>} - Returns true if token is valid
 */
const verifyTurnstile = async (token, secretKey, remoteip = null) => {
  // If Turnstile is not configured, skip verification (for development)
  if (!secretKey || secretKey === 'your-turnstile-secret-key') {
    console.warn('Turnstile secret key not configured. Skipping verification.');
    return true;
  }

  if (!token) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      secret: secretKey,
      response: token,
      ...(remoteip && { remoteip }),
    });

    const options = {
      hostname: 'challenges.cloudflare.com',
      port: 443,
      path: '/turnstile/v0/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          resolve(result.success === true);
        } catch (error) {
          console.error('Error parsing Turnstile response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error verifying Turnstile token:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = verifyTurnstile;
