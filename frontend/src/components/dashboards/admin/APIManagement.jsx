import React from 'react';

const APIManagement = () => {
  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          API Management
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Generate, revoke, and monitor API keys for third-party integrations.
          </p>
          {/* API management interface will be implemented here */}
        </div>
      </div>
    </div>
  );
};

export default APIManagement;
