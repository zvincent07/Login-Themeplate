import React from 'react';

const VersionDisplay = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Version Display
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Clearly showing which version of the software is currently live (e.g., v2.4.1) to help with bug reporting.
        </p>
        {/* Version display will be implemented here */}
      </div>
    </div>
  );
};

export default VersionDisplay;
