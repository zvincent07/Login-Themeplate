/**
 * Cursor Movement Tracker
 * Tracks mouse movements to detect bot-like behavior
 */

class CursorTracker {
  constructor() {
    this.movements = [];
    this.startTime = null;
    this.isTracking = false;
    this.maxMovements = 100; // Store last 100 movements
  }

  startTracking() {
    this.movements = [];
    this.startTime = Date.now();
    this.isTracking = true;
    
    // Bind handlers once and store references for cleanup
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    
    // Track mouse movements
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    
    // Track mouse clicks
    document.addEventListener('click', this.boundHandleClick);
    
    // Track keyboard activity
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  stopTracking() {
    this.isTracking = false;
    
    // Remove listeners using stored bound references
    if (this.boundHandleMouseMove) {
      document.removeEventListener('mousemove', this.boundHandleMouseMove);
    }
    if (this.boundHandleClick) {
      document.removeEventListener('click', this.boundHandleClick);
    }
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown);
    }
    
    // Clear references
    this.boundHandleMouseMove = null;
    this.boundHandleClick = null;
    this.boundHandleKeyDown = null;
  }

  handleMouseMove(e) {
    if (!this.isTracking) return;

    const now = Date.now();
    const timeSinceStart = now - this.startTime;

    this.movements.push({
      type: 'move',
      x: e.clientX,
      y: e.clientY,
      timestamp: now,
      timeSinceStart,
    });

    // Keep only last N movements
    if (this.movements.length > this.maxMovements) {
      this.movements.shift();
    }
  }

  handleClick(e) {
    if (!this.isTracking) return;

    const now = Date.now();
    const timeSinceStart = now - this.startTime;

    this.movements.push({
      type: 'click',
      x: e.clientX,
      y: e.clientY,
      timestamp: now,
      timeSinceStart,
    });
  }

  handleKeyDown(e) {
    if (!this.isTracking) return;

    const now = Date.now();
    const timeSinceStart = now - this.startTime;

    this.movements.push({
      type: 'keydown',
      key: e.key,
      timestamp: now,
      timeSinceStart,
    });
  }

  /**
   * Analyze cursor movements for bot-like patterns
   * Returns analysis data
   */
  analyze() {
    if (this.movements.length < 5) {
      return {
        isSuspicious: false,
        score: 0,
        reasons: [],
        data: {
          totalMovements: this.movements.length,
          duration: Date.now() - this.startTime,
        },
      };
    }

    const moveEvents = this.movements.filter(m => m.type === 'move');
    const clickEvents = this.movements.filter(m => m.type === 'click');
    const keyEvents = this.movements.filter(m => m.type === 'keydown');

    const reasons = [];
    let score = 0;

    // Check 1: Too few movements (bot might not move mouse)
    if (moveEvents.length < 3) {
      reasons.push('Very few mouse movements detected');
      score += 30;
    }

    // Check 2: Perfectly straight lines (bots often move in straight lines)
    if (moveEvents.length >= 3) {
      const straightLineCount = this.detectStraightLines(moveEvents);
      if (straightLineCount > moveEvents.length * 0.5) {
        reasons.push('Too many perfectly straight movements');
        score += 40;
      }
    }

    // Check 3: Unnatural speed (too fast or too consistent)
    if (moveEvents.length >= 2) {
      const speedAnalysis = this.analyzeSpeed(moveEvents);
      if (speedAnalysis.isUnnatural) {
        reasons.push('Unnatural movement speed detected');
        score += 35;
      }
    }

    // Check 4: No human-like pauses or variations
    if (moveEvents.length >= 5) {
      const variationAnalysis = this.analyzeVariation(moveEvents);
      if (variationAnalysis.isTooConsistent) {
        reasons.push('Movement patterns too consistent (lacks human variation)');
        score += 30;
      }
    }

    // Check 5: Movements only in specific areas (like form fields)
    if (moveEvents.length >= 3) {
      const areaAnalysis = this.analyzeMovementArea(moveEvents);
      if (areaAnalysis.isRestricted) {
        reasons.push('Movements restricted to form areas only');
        score += 25;
      }
    }

    // Check 6: No clicks or keyboard activity (bot might only move mouse)
    if (clickEvents.length === 0 && keyEvents.length === 0 && moveEvents.length > 10) {
      reasons.push('No clicks or keyboard activity despite movements');
      score += 20;
    }

    // Check 7: Movements happen too quickly after page load
    const timeSinceStart = Date.now() - this.startTime;
    if (timeSinceStart < 2000 && moveEvents.length > 5) {
      reasons.push('Suspiciously fast activity after page load');
      score += 15;
    }

    // Check 8: Perfect timing intervals (bots often have consistent timing)
    if (moveEvents.length >= 5) {
      const timingAnalysis = this.analyzeTiming(moveEvents);
      if (timingAnalysis.isTooRegular) {
        reasons.push('Movement timing too regular');
        score += 20;
      }
    }

    const isSuspicious = score >= 50; // Threshold for bot detection

    return {
      isSuspicious,
      score: Math.min(score, 100), // Cap at 100
      reasons,
      data: {
        totalMovements: this.movements.length,
        moveEvents: moveEvents.length,
        clickEvents: clickEvents.length,
        keyEvents: keyEvents.length,
        duration: timeSinceStart,
        movements: this.movements.slice(-20), // Last 20 movements for analysis
      },
    };
  }

  detectStraightLines(movements) {
    let straightLineCount = 0;
    const threshold = 2; // pixels tolerance for "straight"

    for (let i = 2; i < movements.length; i++) {
      const p1 = movements[i - 2];
      const p2 = movements[i - 1];
      const p3 = movements[i];

      // Calculate if three points form a straight line
      const dist1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const dist2 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
      const dist3 = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2));

      // If the sum of two sides equals the third (within threshold), it's a straight line
      if (Math.abs(dist1 + dist2 - dist3) < threshold) {
        straightLineCount++;
      }
    }

    return straightLineCount;
  }

  analyzeSpeed(movements) {
    const speeds = [];
    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const time = curr.timestamp - prev.timestamp;
      const speed = time > 0 ? distance / time : 0;
      speeds.push(speed);
    }

    if (speeds.length === 0) {
      return { isUnnatural: false };
    }

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
    const stdDev = Math.sqrt(variance);

    // If speed is too consistent (low variance) or too fast, it's suspicious
    const isUnnatural = stdDev < 0.1 || avgSpeed > 10;

    return { isUnnatural, avgSpeed, stdDev };
  }

  analyzeVariation(movements) {
    if (movements.length < 5) {
      return { isTooConsistent: false };
    }

    const distances = [];
    const angles = [];

    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      
      distances.push(distance);
      angles.push(angle);
    }

    // Calculate coefficient of variation for distances
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const distVariance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
    const distStdDev = Math.sqrt(distVariance);
    const coeffVariation = avgDist > 0 ? distStdDev / avgDist : 0;

    // If variation is too low, movements are too consistent
    const isTooConsistent = coeffVariation < 0.3;

    return { isTooConsistent, coeffVariation };
  }

  analyzeMovementArea(movements) {
    if (movements.length < 3) {
      return { isRestricted: false };
    }

    // Get bounding box of movements
    const xs = movements.map(m => m.x);
    const ys = movements.map(m => m.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If movements are restricted to less than 20% of viewport, it's suspicious
    const areaRatio = (width * height) / (viewportWidth * viewportHeight);
    const isRestricted = areaRatio < 0.2;

    return { isRestricted, areaRatio, width, height };
  }

  analyzeTiming(movements) {
    if (movements.length < 5) {
      return { isTooRegular: false };
    }

    const intervals = [];
    for (let i = 1; i < movements.length; i++) {
      intervals.push(movements[i].timestamp - movements[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coeffVariation = avgInterval > 0 ? stdDev / avgInterval : 0;

    // If timing is too regular (low coefficient of variation), it's suspicious
    const isTooRegular = coeffVariation < 0.2 && intervals.length >= 5;

    return { isTooRegular, coeffVariation };
  }

  /**
   * Get movement data for sending to backend
   */
  getMovementData() {
    return {
      movements: this.movements,
      analysis: this.analyze(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }
}

export default CursorTracker;
