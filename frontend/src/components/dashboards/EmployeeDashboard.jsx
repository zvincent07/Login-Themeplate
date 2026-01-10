import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from './layout/DashboardLayout';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'employee-dashboard',
      label: 'Employee Dashboard',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      ),
    },
    {
      id: 'help',
      label: 'Help',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  const breadcrumbs = ['Home', 'Dashboard'];

  return (
    <DashboardLayout
      user={user}
      navigationItems={navigationItems}
      breadcrumbs={breadcrumbs}
      notificationCount={0}
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Employee Dashboard
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">Email</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {user.email}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">Role</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 capitalize">
              {user.roleName || 'Employee'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
