import React from 'react';

const Roles = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Role-Based Access Control (RBAC)
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Manage roles and assign them to users (e.g., "Super Admin," "Editor," "Viewer," "Support Staff").
        </p>
        {/* RBAC interface will be implemented here */}
      </div>
    </div>
  );
};

export default Roles;
