const BannedIP = require('../models/BannedIP');

/**
 * Analyze cursor movement data for bot-like behavior
 */
const analyzeMovements = (movementData) => {
  if (!movementData || !movementData.movements || movementData.movements.length < 5) {
    return {
      isBot: false,
      score: 0,
      reasons: ['Insufficient movement data'],
    };
  }

  const movements = movementData.movements;
  const moveEvents = movements.filter(m => m.type === 'move');
  const clickEvents = movements.filter(m => m.type === 'click');
  const keyEvents = movements.filter(m => m.type === 'keydown');

  let score = 0;
  const reasons = [];

  // Only flag if we have enough data to analyze
  if (moveEvents.length < 10) {
    return {
      isBot: false,
      score: 0,
      reasons: ['Insufficient data for analysis'],
    };
  }

  // Check 1: Very few movements (only if NO interactions at all)
  if (moveEvents.length < 5 && clickEvents.length === 0 && keyEvents.length === 0) {
    score += 15;
    reasons.push('Very few mouse movements and no interactions');
  }

  // Check 2: No clicks or keyboard activity (only if many movements)
  if (clickEvents.length === 0 && keyEvents.length === 0 && moveEvents.length > 30) {
    score += 20;
    reasons.push('Many movements but no user interactions');
  }

  // Check 3: Perfectly straight movements (more strict - need 80%+ straight)
  let straightCount = 0;
  for (let i = 2; i < moveEvents.length && i < 30; i++) {
    const p1 = moveEvents[i - 2];
    const p2 = moveEvents[i - 1];
    const p3 = moveEvents[i];
    
    const dist1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const dist2 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
    const dist3 = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2));
    
    // More strict: need to be almost perfectly straight (within 1 pixel)
    if (dist1 > 5 && dist2 > 5 && Math.abs(dist1 + dist2 - dist3) < 1) {
      straightCount++;
    }
  }
  
  // Only flag if 80%+ are perfectly straight AND we have many movements
  if (straightCount > moveEvents.length * 0.8 && moveEvents.length >= 20) {
    score += 30;
    reasons.push('Too many perfectly straight movements');
  }

  // Check 4: Unnatural speed consistency (more strict)
  if (moveEvents.length >= 10) {
    const speeds = [];
    for (let i = 1; i < moveEvents.length && i < 30; i++) {
      const prev = moveEvents[i - 1];
      const curr = moveEvents[i];
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const time = curr.timestamp - prev.timestamp;
      if (time > 0 && distance > 0) {
        speeds.push(distance / time);
      }
    }
    
    if (speeds.length >= 10) {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
      const stdDev = Math.sqrt(variance);
      
      // More strict: need very low variance (< 0.05) to flag
      if (stdDev < 0.05 && avgSpeed > 0.5) {
        score += 25;
        reasons.push('Unnatural movement speed consistency');
      }
    }
  }

  // Check 5: Restricted movement area (removed - too many false positives)

  // Check 6: Too fast after page load (removed - legitimate users can be fast)

  // Check 7: Perfect timing intervals (more strict)
  if (moveEvents.length >= 15) {
    const intervals = [];
    for (let i = 1; i < moveEvents.length && i < 30; i++) {
      intervals.push(moveEvents[i].timestamp - moveEvents[i - 1].timestamp);
    }
    
    if (intervals.length >= 10) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const coeffVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
      
      // More strict: need very regular timing (< 0.1 coefficient of variation)
      if (coeffVariation < 0.1 && intervals.length >= 15) {
        score += 20;
        reasons.push('Movement timing too regular');
      }
    }
  }

  // Check 8: If user has clicks/keyboard, reduce suspicion
  if (clickEvents.length > 0 || keyEvents.length > 0) {
    score = Math.max(0, score - 10); // Reduce score if there are interactions
  }

  // Much higher threshold - only ban obvious bots (80+ instead of 50)
  const isBot = score >= 80;

  return {
    isBot,
    score: Math.min(score, 100),
    reasons,
  };
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
};

/**
 * Bot detection middleware
 */
const botDetection = async (req, res, next) => {
  // Only check on login/register endpoints
  if (!req.path.includes('/login') && !req.path.includes('/register')) {
    return next();
  }

  const ip = getClientIP(req);
  
  // Whitelist localhost and common development IPs
  const whitelistIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
  if (whitelistIPs.includes(ip) || ip === 'unknown') {
    delete req.body.movementData;
    return next();
  }
  
  // Check if IP is already banned
  const isBanned = await BannedIP.isBanned(ip);
  if (isBanned) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Your IP has been temporarily banned due to suspicious activity.',
    });
  }

  // Check for movement data in request body
  const movementData = req.body.movementData;
  
  // If no movement data, allow but log (graceful degradation)
  if (!movementData || !movementData.movements || movementData.movements.length === 0) {
    delete req.body.movementData;
    return next(); // Allow login without movement data
  }
  
  // Analyze movements
  const analysis = analyzeMovements(movementData);
  
  // Only ban if score is very high (obvious bot)
  if (analysis.isBot && analysis.score >= 80) {
    // Ban the IP
    await BannedIP.banIP(ip, 'bot_detection', {
      movementData,
      analysis,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });

    return res.status(403).json({
      success: false,
      error: 'Suspicious activity detected. Access denied.',
      details: process.env.NODE_ENV === 'development' ? analysis.reasons : undefined,
    });
  }

  // Remove movementData from body before passing to controller
  delete req.body.movementData;
  
  next();
};

module.exports = botDetection;
