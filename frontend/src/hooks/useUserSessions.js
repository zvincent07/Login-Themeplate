import { useState, useCallback } from 'react';
import userService from '../services/userService';

/**
 * Custom hook for managing user sessions
 */
export const useUserSessions = () => {
  const [userSessions, setUserSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionForMap, setSelectedSessionForMap] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch user sessions
   */
  const fetchUserSessions = useCallback(async (userId) => {
    setLoadingSessions(true);
    setUserSessions([]);
    setSelectedSessionForMap(null);
    
    try {
      const response = await userService.getUserSessions(userId);
      if (response.success) {
        setUserSessions(response.data || []);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  /**
   * Terminate a single session with Optimistic UI
   */
  const handleTerminateSession = useCallback(async (userId, sessionId) => {
    // Optimistic UI: Save current sessions for rollback
    const previousSessions = [...userSessions];
    
    // Update UI immediately - remove the session
    setUserSessions(prevSessions => 
      prevSessions.filter(s => s._id !== sessionId)
    );
    
    try {
      setSubmitting(true);
      const response = await userService.terminateSession(userId, sessionId);
      
      if (response.success) {
        return { success: true };
      } else {
        // Failure: Rollback optimistic update
        setUserSessions(previousSessions);
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUserSessions(previousSessions);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [userSessions]);

  /**
   * Terminate all other sessions (keep current) with Optimistic UI
   */
  const handleTerminateAllOthers = useCallback(async (userId) => {
    // Optimistic UI: Save current sessions for rollback
    const previousSessions = [...userSessions];
    
    // Update UI immediately - keep only current session
    setUserSessions(prevSessions => 
      prevSessions.filter(s => s.isCurrent === true)
    );
    
    try {
      setSubmitting(true);
      const response = await userService.terminateAllOtherSessions(userId);
      
      if (response.success) {
        return { 
          success: true, 
          terminatedCount: response.terminatedCount || 0,
          message: response.message || `Terminated ${response.terminatedCount || 0} session(s) successfully`
        };
      } else {
        // Failure: Rollback optimistic update
        setUserSessions(previousSessions);
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUserSessions(previousSessions);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [userSessions]);

  return {
    // State
    userSessions,
    loadingSessions,
    selectedSessionForMap,
    submitting,
    
    // Setters
    setUserSessions,
    setSelectedSessionForMap,
    
    // Actions
    fetchUserSessions,
    handleTerminateSession,
    handleTerminateAllOthers,
  };
};
