import React from 'react';

const DashboardOverview = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Dashboard Overview
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          High-level metrics: Daily Active Users, Total Revenue, Server CPU Load, Recent Error Rate.
        </p>
        {/* Dashboard metrics will be displayed here */}
      </div>
    </div>
  );
};

export default DashboardOverview;
