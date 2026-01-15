/**
 * OPTIMISTIC UI HOOK
 * 
 * Provides optimistic UI updates with automatic rollback on error
 * 
 * Usage:
 * const { updateOptimistically, rollback } = useOptimisticUpdate(setData);
 * 
 * try {
 *   const previousState = [...data];
 *   updateOptimistically(newData);
 *   const response = await apiCall();
 *   if (!response.success) throw new Error('Failed');
 * } catch (error) {
 *   rollback(previousState);
 *   setToast({ message: 'Failed', type: 'error' });
 * }
 */

import { useRef, useCallback } from 'react';

const useOptimisticUpdate = (setState) => {
  const previousStateRef = useRef(null);

  /**
   * Snapshot current state and update optimistically
   */
  const updateOptimistically = useCallback(
    (newState) => {
      // Get current state from setState function (if it's a function)
      // Otherwise, we'll rely on the caller to pass previousState
      previousStateRef.current = newState;
      
      // Update state immediately
      if (typeof setState === 'function') {
        setState((prev) => {
          previousStateRef.current = prev;
          return typeof newState === 'function' ? newState(prev) : newState;
        });
      } else {
        // If setState is not a function, assume newState is the new value
        setState(newState);
      }
    },
    [setState]
  );

  /**
   * Rollback to previous state
   */
  const rollback = useCallback(() => {
    if (previousStateRef.current !== null) {
      setState(previousStateRef.current);
      previousStateRef.current = null;
    }
  }, [setState]);

  /**
   * Snapshot current state (for manual rollback)
   */
  const snapshot = useCallback(() => {
    return previousStateRef.current;
  }, []);

  return {
    updateOptimistically,
    rollback,
    snapshot,
  };
};

export default useOptimisticUpdate;
