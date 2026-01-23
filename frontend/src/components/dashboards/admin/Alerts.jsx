import React from 'react';

const Alerts = () => {
  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          Real-time Alerts
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Notifications (via email, Slack, or SMS) when critical thresholds are breached (e.g., "Server disk space is 90% full" or "Payment gateway is down").
          </p>
          {/* Alerts interface will be implemented here */}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
