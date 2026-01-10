import React from 'react';

const IPManagement = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        IP Whitelisting/Blacklisting
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Restrict access to specific office IP addresses or block suspicious traffic sources.
        </p>
        {/* IP management interface will be implemented here */}
      </div>
    </div>
  );
};

export default IPManagement;
