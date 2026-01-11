import React, { useState, useEffect } from 'react';
import userService from '../../../services/userService';

const UserSessions = ({
  user,
  sessions,
  loading,
  onClose,
  onTerminateSession,
  submitting,
  onTerminateAllOthers,
}) => {
  const [confirmTerminate, setConfirmTerminate] = useState(null);
  const [confirmTerminateAll, setConfirmTerminateAll] = useState(false);
  const [displayedSessions, setDisplayedSessions] = useState(10); // Lazy loading: show first 10

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const sessionDate = new Date(date);
    const diffMs = now - sessionDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return sessionDate.toLocaleDateString();
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get Google Maps embed URL
  const getGoogleMapsUrl = (session) => {
    if (!session.location || !session.location.latitude || !session.location.longitude) {
      return null;
    }
    const { latitude, longitude } = session.location;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=12`;
    } else {
      return `https://www.google.com/maps?q=${latitude},${longitude}&z=12`;
    }
  };

  // Get IP display info
  const getIPDisplay = (session) => {
    let ip = session.ipAddress || '';
    
    // Clean up IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
    
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return {
        ip: 'Localhost',
        label: 'Local Development',
        isLocal: true,
      };
    }
    return {
      ip: ip,
      label: 'IP Address',
      isLocal: false,
    };
  };

  // Format location string - filter out "Unknown" and null values
  const formatLocation = (location) => {
    if (!location) return null;
    
    const parts = [
      location.city,
      location.region,
      location.country,
    ].filter(item => item && item !== 'Unknown' && item !== 'null');
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Get device icon based on device type
  const getDeviceIcon = (device, platform) => {
    if (device === 'Mobile' || platform === 'iOS' || platform === 'Android') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (device === 'Tablet' || platform === 'iPadOS') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // Handle terminate with confirmation
  const handleTerminateClick = (sessionId) => {
    if (confirmTerminate === sessionId) {
      // Second click - confirm
      onTerminateSession(sessionId);
      setConfirmTerminate(null);
    } else {
      // First click - show confirmation
      setConfirmTerminate(sessionId);
      // Auto-hide after 3 seconds
      setTimeout(() => setConfirmTerminate(null), 3000);
    }
  };

  // Handle terminate all others - show modal
  const handleTerminateAllOthersClick = () => {
    setConfirmTerminateAll(true);
  };

  // Handle confirm revoke all others
  const handleConfirmRevokeAll = async () => {
    try {
      await onTerminateAllOthers();
      // Modal will close automatically when sessions refresh (otherSessionsCount becomes 0)
      // But we also close it here in case of immediate success
      setConfirmTerminateAll(false);
    } catch (error) {
      // Error handling is done in parent component
      // Keep modal open on error so user can retry
    }
  };

  // Get sessions to display (for lazy loading)
  const sessionsToDisplay = sessions.slice(0, displayedSessions);
  const hasMoreSessions = sessions.length > displayedSessions;
  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  // Auto-close modal when all other sessions are revoked (success case)
  useEffect(() => {
    if (confirmTerminateAll && otherSessionsCount === 0 && !submitting) {
      setConfirmTerminateAll(false);
    }
  }, [otherSessionsCount, confirmTerminateAll, submitting]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">User Sessions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage active sessions for {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
            </p>
          </div>
          {/* Revoke All Others Button */}
          {otherSessionsCount > 0 && (
            <div className="flex-shrink-0">
              <button
                onClick={handleTerminateAllOthersClick}
                disabled={submitting || loading}
                className="px-3 py-1.5 text-xs font-medium border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                title="Revoke all other sessions except current"
              >
                Revoke All Others ({otherSessionsCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Sessions List */}
      <div className="flex-1 overflow-y-auto mt-4 max-h-[500px] pr-2">
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsToDisplay.map((session) => {
              const ipInfo = getIPDisplay(session);
              const hasLocation = session.location?.latitude && session.location?.longitude;
              const locationString = formatLocation(session.location);
              const isLocalhost = ipInfo.isLocal;
              
              return (
                <div
                  key={session._id}
                  className={`bg-white dark:bg-slate-800 border rounded-lg p-4 transition-all ${
                    session.isCurrent
                      ? 'border-l-4 border-l-blue-600 dark:border-l-blue-500 border-gray-200 dark:border-slate-700'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {/* Main Session Info - Compact Layout */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Session Details */}
                    <div className="flex-1 space-y-2">
                      {/* First Row: Platform, Browser, IP */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Platform with Device Icon */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400">
                            {getDeviceIcon(session.device, session.platform)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {session.platform || 'Unknown'}
                            </span>
                            {session.isCurrent && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Current Session
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Browser */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {session.browser || 'Unknown'}
                          </span>
                        </div>

                        {/* IP Address */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                          <span className={`text-sm font-mono ${
                            ipInfo.isLocal
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {session.ipAddress || ipInfo.ip}
                          </span>
                        </div>

                        {/* Location (if available and not localhost) */}
                        {locationString && !isLocalhost && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {locationString}
                            </span>
                          </div>
                        )}

                        {/* Localhost Badge */}
                        {isLocalhost && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                              Local Development
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Second Row: Last Active */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Last active: {formatRelativeTime(session.lastActive)} ({formatDate(session.lastActive)})
                        </span>
                      </div>

                      {/* Map - Only show for real IPs with coordinates */}
                      {hasLocation && !isLocalhost && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                          <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
                            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={getGoogleMapsUrl(session)}
                                title="Session location"
                              ></iframe>
                            ) : (
                              <a
                                href={getGoogleMapsUrl(session)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <div className="text-center p-2">
                                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    View on Google Maps
                                  </p>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Revoke Action */}
                    {!session.isCurrent && (
                      <div className="flex-shrink-0">
                        {confirmTerminate === session._id ? (
                          <button
                            onClick={() => handleTerminateClick(session._id)}
                            disabled={submitting}
                            className="px-3 py-1.5 text-xs font-medium bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="Click again to confirm"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTerminateClick(session._id)}
                            disabled={submitting}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 group relative"
                            title="Revoke this session"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {/* Tooltip */}
                            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Revoke this session
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More Button (Lazy Loading) */}
            {hasMoreSessions && (
              <div className="pt-2 pb-2 text-center">
                <button
                  onClick={() => setDisplayedSessions(prev => prev + 10)}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Load More ({sessions.length - displayedSessions} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revoke All Others Confirmation Modal */}
      {confirmTerminateAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                Revoke Sessions?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to sign out of {otherSessionsCount} other device{otherSessionsCount !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmTerminateAll(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRevokeAll}
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Revoking...</span>
                    </>
                  ) : (
                    'Revoke'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSessions;
