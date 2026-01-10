import React from 'react';

const JobQueues = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Job Queues
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Visibility into background tasks (e.g., "300 emails pending," "Video processing stuck").
        </p>
        {/* Job queues interface will be implemented here */}
      </div>
    </div>
  );
};

export default JobQueues;
