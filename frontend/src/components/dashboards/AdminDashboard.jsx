import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from './layout/DashboardLayout';

const AdminDashboard = () => {
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
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
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
      notificationCount={99}
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Admin Dashboard
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to the admin dashboard. Content will go here.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
