import React from 'react';

const ErrorLogs = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Error Logs
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Readable feed of system errors without needing to access the raw server code.
        </p>
        {/* Error logs interface will be implemented here */}
      </div>
    </div>
  );
};

export default ErrorLogs;
