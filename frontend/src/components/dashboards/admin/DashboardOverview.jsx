import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '../../../services/dashboardService';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    activeUsers: { count: 0, growth: 12 },
    revenue: { amount: 24500, trend: 4.5 },
    cpuLoad: { value: 0 },
    errorRate: { value: 0, growth: 0.02 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getDashboardStats();
        if (response.success && response.data) {
          setStats(prev => ({
            ...prev,
            activeUsers: { ...prev.activeUsers, count: response.data.activeUsers.count },
            cpuLoad: { value: response.data.cpuLoad.value },
            errorRate: { value: response.data.errorRate.value, growth: 0 },
            // Revenue is still mocked in backend, so we keep using the response or default
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh CPU load every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mock Trend Data (Visuals only for now)
  const activeUsersData = [
    { name: 'Mon', users: 4000 },
    { name: 'Tue', users: 3000 },
    { name: 'Wed', users: 2000 },
    { name: 'Thu', users: 2780 },
    { name: 'Fri', users: 1890 },
    { name: 'Sat', users: 2390 },
    { name: 'Sun', users: stats.activeUsers.count || 3490 },
  ];

  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ];

  const cpuData = [
    { name: 'Used', value: stats.cpuLoad.value },
    { name: 'Free', value: 100 - stats.cpuLoad.value },
  ];
  const CPU_COLORS = ['#3b82f6', '#e2e8f0'];

  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Daily Active Users */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Daily Active Users
            </h2>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.activeUsers.count.toLocaleString()}
              </span>
              <span className="ml-2 text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                +{stats.activeUsers.growth}%
              </span>
            </div>
          </div>
          <div className="h-16 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeUsersData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Revenue
            </h2>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                ${stats.revenue.amount.toLocaleString()}
              </span>
              <span className="ml-2 text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                +{stats.revenue.trend}%
              </span>
            </div>
          </div>
          <div className="h-16 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Server CPU Load */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Server CPU Load
            </h2>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.cpuLoad.value}%
              </span>
            </div>
          </div>
          <div className="h-20 mt-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cpuData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {cpuData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CPU_COLORS[index % CPU_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-xs font-bold ${stats.cpuLoad.value > 80 ? 'text-red-500' :
                  stats.cpuLoad.value > 50 ? 'text-yellow-500' :
                    'text-green-500'
                }`}>
                {stats.cpuLoad.value > 80 ? 'High' : stats.cpuLoad.value > 50 ? 'Med' : 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Recent Error Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recent Error Rate
            </h2>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.errorRate.value}%
              </span>
              <span className="ml-2 text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
                +{stats.errorRate.growth}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.errorRate.value * 10, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
              Last 24 Hours
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DashboardOverview;
