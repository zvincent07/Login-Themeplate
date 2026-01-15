/**
 * SESSION REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const Session = require('../models/Session');

class SessionRepository {
  /**
   * Find active sessions for user
   */
  async findActiveByUserId(userId, options = {}) {
    const { excludeToken = null } = options;
    
    const query = {
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    };
    
    let sessions = await Session.find(query)
      .sort({ lastActive: -1 })
      .select('-token')
      .lean();
    
    // Mark current session if token provided
    if (excludeToken) {
      const currentSession = await Session.findOne({
        user: userId,
        token: excludeToken,
        isActive: true,
      }).select('_id').lean();
      
      if (currentSession) {
        sessions = sessions.map(session => ({
          ...session,
          isCurrent: session._id.toString() === currentSession._id.toString(),
        }));
      }
    }
    
    return sessions;
  }

  /**
   * Create session
   */
  async create(sessionData) {
    const session = await Session.create(sessionData);
    return session.toObject();
  }

  /**
   * Terminate session by ID
   */
  async terminateById(sessionId, userId = null) {
    const query = { _id: sessionId };
    if (userId) {
      query.user = userId;
    }
    
    const session = await Session.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );
    return session ? session.toObject() : null;
  }

  /**
   * Terminate all sessions except current
   */
  async terminateAllExceptCurrent(userId, currentToken) {
    const currentSession = await Session.findOne({
      user: userId,
      token: currentToken,
      isActive: true,
    });
    
    if (!currentSession) {
      return { modifiedCount: 0 };
    }
    
    const result = await Session.updateMany(
      {
        user: userId,
        isActive: true,
        _id: { $ne: currentSession._id },
      },
      {
        $set: { isActive: false },
      }
    );
    
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Count active sessions for user
   */
  async countActiveByUserId(userId) {
    return Session.countDocuments({
      user: userId,
      isActive: true,
    });
  }

  /**
   * Find oldest active sessions
   */
  async findOldestActive(userId, limit) {
    const sessions = await Session.find({
      user: userId,
      isActive: true,
    })
      .sort({ lastActive: 1 })
      .limit(limit)
      .lean();
    
    return sessions;
  }

  /**
   * Deactivate multiple sessions by IDs
   */
  async deactivateMultiple(sessionIds) {
    const result = await Session.updateMany(
      { _id: { $in: sessionIds } },
      { $set: { isActive: false } }
    );
    
    return { modifiedCount: result.modifiedCount };
  }
}

module.exports = new SessionRepository();
