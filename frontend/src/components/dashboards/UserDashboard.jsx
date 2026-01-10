import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from './layout/DashboardLayout';

const UserDashboard = () => {
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
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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
        Dashboard
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
              {user.roleName || 'User'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
