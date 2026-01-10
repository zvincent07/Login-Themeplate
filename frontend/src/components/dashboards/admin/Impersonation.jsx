import React from 'react';

const Impersonation = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        User Impersonation (Shadowing)
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          "Log in as User" feature allows admins to see exactly what a specific user sees. Essential for troubleshooting support tickets.
        </p>
        {/* Impersonation interface will be implemented here */}
      </div>
    </div>
  );
};

export default Impersonation;
