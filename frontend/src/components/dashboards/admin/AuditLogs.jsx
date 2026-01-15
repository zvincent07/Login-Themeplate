import React, { useEffect, useState, useMemo, useRef } from 'react';
import UAParser from 'ua-parser-js';
import auditLogService from '../../../services/auditLogService';
import { Toast, Badge, Button, Modal, FormField, Input, Pagination } from '../../ui';

const PAGE_SIZE = 20;

const resourceTypeOptions = [
  { value: 'all', label: 'All resources' },
  { value: 'user', label: 'Users' },
  { value: 'role', label: 'Roles' },
  { value: 'session', label: 'Sessions' },
  { value: 'auth', label: 'Authentication' },
  { value: 'system', label: 'System' },
];

// Helper to get action badge color
const getActionBadgeColor = (action) => {
  if (!action) return 'gray';
  
  const actionUpper = action.toUpperCase();
  
  // Green: Create / Success
  if (
    actionUpper.includes('CREATE') ||
    actionUpper.includes('SUCCESS') ||
    actionUpper.includes('ENABLED') ||
    actionUpper.includes('RESTORED')
  ) {
    return 'green';
  }
  
  // Red: Delete / Fail
  if (
    actionUpper.includes('DELETE') ||
    actionUpper.includes('FAILED') ||
    actionUpper.includes('DISABLED') ||
    actionUpper.includes('REVOKED')
  ) {
    return 'red';
  }
  
  // Blue/Orange: Update / Modify
  if (
    actionUpper.includes('UPDATE') ||
    actionUpper.includes('MODIFY') ||
    actionUpper.includes('PROMOTED') ||
    actionUpper.includes('RESET')
  ) {
    return 'blue';
  }
  
  // Default: gray
  return 'gray';
};

// Helper to parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return { icon: 'desktop', text: 'Unknown', device: 'Desktop' };
  }
  
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let platform = 'Unknown';
  let device = 'Desktop';
  let icon = 'desktop';
  
  // Detect browser
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
  }
  
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
    icon = 'mobile';
  } else if (ua.includes('iphone')) {
    platform = 'iOS';
    device = 'Mobile';
    icon = 'mobile';
  } else if (ua.includes('ipad')) {
    platform = 'iPadOS';
    device = 'Tablet';
    icon = 'tablet';
  }
  
  return {
    icon,
    text: `${browser} on ${platform}`,
    device,
  };
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // AbortController ref for canceling in-flight requests
  const abortControllerRef = useRef(null);
  
  // Track if we have successfully loaded data at least once
  const hasLoadedData = useRef(false);

  const [toast, setToast] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Derive a small set of common actions from the loaded logs so the filter feels smart
  const actionOptions = useMemo(() => {
    const base = new Set(['all']);
    logs.forEach((log) => {
      if (log.action) base.add(log.action);
    });
    return Array.from(base);
  }, [logs]);

  const fetchLogs = async (options = {}) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const nextPage = options.page ?? page;
      
      // Only show full loading state if we haven't loaded data yet
      if (!hasLoadedData.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError(null);

      const response = await auditLogService.getAuditLogs({
        page: nextPage,
        limit: PAGE_SIZE,
        search: options.search ?? (search.trim() || undefined),
        resourceType: options.resourceType ?? resourceType,
        action: options.action ?? actionFilter,
      }, abortController.signal);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }

      setLogs(response.data || []);
      hasLoadedData.current = true;
      if (response.pagination) {
        setPage(response.pagination.page);
        setTotalPages(response.pagination.pages || 1);
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      setError(err.message || 'Failed to fetch audit logs');
      setToast({
        message: err.message || 'Failed to fetch audit logs',
        type: 'error',
      });
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs({ page: 1 });
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResourceTypeChange = (e) => {
    const value = e.target.value;
    setResourceType(value);
    setPage(1);
    fetchLogs({ page: 1, resourceType: value });
  };

  const handleActionFilterChange = (e) => {
    const value = e.target.value;
    setActionFilter(value);
    setPage(1);
    fetchLogs({ page: 1, action: value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs({ page: 1 });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    fetchLogs({ page: nextPage });
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowDrawer(true);
    setCopied(false);
  };

  const handleCopyJSON = async () => {
    if (!selectedLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({
        message: 'Failed to copy to clipboard',
        type: 'error',
      });
    }
  };

  // Parse user agent for drawer display
  const parseUserAgentForDrawer = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', display: 'Unknown' };
    
    const parser = new UAParser();
    parser.setUA(userAgent);
    const result = parser.getResult();
    
    const browser = result.browser.name || 'Unknown';
    const os = result.os.name || 'Unknown';
    const osVersion = result.os.version ? ` ${result.os.version}` : '';
    
    return {
      browser,
      os,
      display: `${browser} on ${os}${osVersion}`,
    };
  };

  const formatTimestamp = (iso) => {
    if (!iso) return 'N/A';
    try {
      const date = new Date(iso);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatAction = (action) => {
    if (!action) return 'Unknown';
    return action
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const formatResourceType = (type) => {
    if (!type) return 'Unknown';
    const option = resourceTypeOptions.find((o) => o.value === type);
    return option ? option.label : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getBadgeVariant = (action) => {
    const color = getActionBadgeColor(action);
    switch (color) {
      case 'green':
        return 'success';
      case 'red':
        return 'danger';
      case 'blue':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Audit Logs
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-4 p-4 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
          <FormField label="Search" className="flex-1">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, target, or action…"
            />
          </FormField>

          <FormField label="Resource" className="w-full sm:w-40">
            <select
              value={resourceType}
              onChange={handleResourceTypeChange}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {resourceTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Action" className="w-full sm:w-40">
            <select
              value={actionFilter}
              onChange={handleActionFilterChange}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">All actions</option>
              {actionOptions
                .filter((a) => a !== 'all')
                .map((a) => (
                  <option key={a} value={a}>
                    {formatAction(a)}
                  </option>
                ))}
            </select>
          </FormField>
        </form>

        {/* Only show Reset button when filters are applied */}
        {(search.trim() !== '' || resourceType !== 'all' || actionFilter !== 'all') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setResourceType('all');
              setActionFilter('all');
              fetchLogs({ page: 1, search: '', resourceType: 'all', action: 'all' });
            }}
            className="self-start sm:self-auto h-9 w-9 p-0"
            title="Reset all filters"
            aria-label="Reset filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        )}
      </div>

      {/* Logs Table */}
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        {loading && logs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 && !error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No audit entries found for the current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      When
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Resource
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                      IP / User Agent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {!loading &&
                    logs.map((log) => {
                      const userAgentInfo = parseUserAgent(log.userAgent);
                      return (
                        <tr
                          key={log._id}
                          onClick={() => handleRowClick(log)}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                            {formatTimestamp(log.createdAt)}
                          </td>
                          <td className="px-2 sm:px-4 py-2.5">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {log.actorName || log.actorEmail || 'System'}
                              </span>
                              {log.actorEmail && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.actorEmail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap">
                            <Badge variant={getBadgeVariant(log.action)} size="sm">
                              {formatAction(log.action)}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                            {log.resourceName || log.resourceId}
                          </td>
                          <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                            {formatResourceType(log.resourceType)}
                          </td>
                          <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                            <div className="flex items-center gap-1.5">
                              <span>{log.ip || 'Unknown'}</span>
                              {log.userAgent && (
                                <>
                                  <span>·</span>
                                  <div className="flex items-center gap-1">
                                    {userAgentInfo.icon === 'mobile' && (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {userAgentInfo.icon === 'tablet' && (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {userAgentInfo.icon === 'desktop' && (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    <span>{userAgentInfo.text}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-400"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - Only show if totalPages > 1 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDrawer && !!selectedLog}
        onClose={() => {
          setShowDrawer(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="2xl"
      >
        {selectedLog && (
          <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  Event Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event ID</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium font-mono">
                      {selectedLog._id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</span>
                    <Badge variant={getBadgeVariant(selectedLog.action)} size="sm">
                      {formatAction(selectedLog.action)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource Type</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {formatResourceType(selectedLog.resourceType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {formatTimestamp(selectedLog.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actor Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  Actor
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {selectedLog.actorName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {selectedLog.actorEmail || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  Target Resource
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource ID</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium font-mono break-all text-right max-w-xs">
                      {selectedLog.resourceId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource Name</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {selectedLog.resourceName || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Changes (if available) */}
              {selectedLog.details?.changes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                    Changes
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4 space-y-3">
                    {Object.entries(selectedLog.details.changes).map(([field, change]) => (
                      <div key={field} className="border-b border-gray-200 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-600 dark:text-red-400 line-through">
                            {change.old !== null && change.old !== undefined ? String(change.old) : 'null'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {change.new !== null && change.new !== undefined ? String(change.new) : 'null'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  Metadata
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP Address</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium font-mono">
                      {selectedLog.ip || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Agent</span>
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {selectedLog.userAgent ? parseUserAgentForDrawer(selectedLog.userAgent).display : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Raw JSON Payload
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJSON}
                    className="w-auto flex items-center gap-1.5"
                    title="Copy JSON to clipboard"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4 overflow-x-auto text-xs text-gray-800 dark:text-gray-200 font-mono relative">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
