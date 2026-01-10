import React from 'react';

const GlobalVariables = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Global Variables
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Update system-wide values (e.g., tax rates, support email address, terms of service text) directly from the UI.
        </p>
        {/* Global variables interface will be implemented here */}
      </div>
    </div>
  );
};

export default GlobalVariables;
