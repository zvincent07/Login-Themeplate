import React from 'react';

const Sessions = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Session Management
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Force password reset, lock accounts, or kill active user sessions. Essential for security when a device is stolen or user is terminated.
        </p>
        {/* Session management interface will be implemented here */}
      </div>
    </div>
  );
};

export default Sessions;
