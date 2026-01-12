import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // small delay so transition runs
    return () => clearTimeout(enterTimer);
  }, []);

  // If the message or type changes while the toast is already shown,
  // reset visibility so the animation and timer feel "fresh" again.
  useEffect(() => {
    setIsVisible(true);
  }, [message, type]);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation before removing from DOM
    setTimeout(() => {
      onClose();
    }, 250);
  };

  // Auto-dismiss after duration.
  // Include message/type so a new toast gets a full duration instead of
  // reusing the remaining time from the previous one.
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, message, type]);

  const bgColor = type === 'success' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
    : type === 'error'
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';

  const textColor = type === 'success'
    ? 'text-green-800 dark:text-green-200'
    : type === 'error'
    ? 'text-red-800 dark:text-red-200'
    : 'text-blue-800 dark:text-blue-200';

  const iconColor = type === 'success'
    ? 'text-green-500'
    : type === 'error'
    ? 'text-red-500'
    : 'text-blue-500';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]">
      <div
        className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px] transform transition-all duration-250 ease-out
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'}`}
      >
        <div className="flex items-start gap-3">
          {type === 'success' && (
            <svg
              className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {type === 'error' && (
            <svg
              className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg
              className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
