const https = require('https');

/**
 * Get geolocation information from IP address
 * Uses ip-api.com (free tier: 45 requests/minute)
 * Alternative: ipapi.co, ipgeolocation.io
 */
const getIPGeolocation = async (ip) => {
  // Skip localhost and private IPs
  if (
    ip === 'localhost' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return {
      country: 'Local',
      region: 'Development',
      city: 'Localhost',
      latitude: null,
      longitude: null,
      timezone: null,
      isp: 'Local Development',
    };
  }

  return new Promise((resolve, reject) => {
    const url = `https://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp`;

    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.status === 'success') {
              resolve({
                country: result.country || 'Unknown',
                region: result.regionName || 'Unknown',
                city: result.city || 'Unknown',
                latitude: result.lat || null,
                longitude: result.lon || null,
                timezone: result.timezone || null,
                isp: result.isp || 'Unknown',
              });
            } else {
              // If API fails, return default values
              resolve({
                country: 'Unknown',
                region: 'Unknown',
                city: 'Unknown',
                latitude: null,
                longitude: null,
                timezone: null,
                isp: 'Unknown',
              });
            }
          } catch (error) {
            // If parsing fails, return default values
            resolve({
              country: 'Unknown',
              region: 'Unknown',
              city: 'Unknown',
              latitude: null,
              longitude: null,
              timezone: null,
              isp: 'Unknown',
            });
          }
        });
      })
      .on('error', (error) => {
        // If request fails, return default values instead of rejecting
        resolve({
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown',
          latitude: null,
          longitude: null,
          timezone: null,
          isp: 'Unknown',
        });
      });
  });
};

/**
 * Parse user agent to extract platform, browser, and device info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      platform: 'Unknown',
      browser: 'Unknown',
      device: 'Unknown',
    };
  }

  const ua = userAgent.toLowerCase();
  let platform = 'Unknown';
  let browser = 'Unknown';
  let device = 'Desktop';

  // Detect platform
  if (ua.includes('windows')) {
    platform = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    platform = 'macOS';
  } else if (ua.includes('linux')) {
    platform = 'Linux';
  } else if (ua.includes('android')) {
    platform = 'Android';
    device = 'Mobile';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    platform = ua.includes('ipad') ? 'iPadOS' : 'iOS';
    device = ua.includes('ipad') ? 'Tablet' : 'Mobile';
  }

  // Detect browser
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Google Chrome';
  } else if (ua.includes('firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
  } else if (ua.includes('opera gx')) {
    browser = 'Opera GX';
  }

  return {
    platform,
    browser,
    device,
  };
};

module.exports = {
  getIPGeolocation,
  parseUserAgent,
};
