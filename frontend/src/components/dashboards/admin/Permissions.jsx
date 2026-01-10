import React from 'react';

const Permissions = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Granular Permissions
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Toggle specific permissions (e.g., "Can view financial data" but "Cannot edit financial data").
        </p>
        {/* Permissions interface will be implemented here */}
      </div>
    </div>
  );
};

export default Permissions;
