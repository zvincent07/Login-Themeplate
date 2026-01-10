import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('Admin Dashboard');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationCount] = useState(99);
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (profileDropdownOpen && profileButtonRef.current) {
      const updatePosition = () => {
        if (profileButtonRef.current) {
          const rect = profileButtonRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const dropdownWidth = 192; // w-48 = 12rem = 192px
          const estimatedDropdownHeight = 200; // Approximate height (more compact now)
          
          // Calculate left position - if sidebar is collapsed, show dropdown to the right
          // If sidebar is open, show dropdown to the right of the sidebar
          let left = rect.right + 8;
          if (sidebarOpen) {
            // When sidebar is open, dropdown appears to the right of the profile button
            left = rect.right + 8;
          } else {
            // When sidebar is collapsed, dropdown appears to the right of the icon
            left = rect.right + 8;
          }
          
          // If dropdown would go off-screen, position it to the left of the button instead
          if (left + dropdownWidth > viewportWidth - 8) {
            left = rect.left - dropdownWidth - 8;
            // Ensure it doesn't go off the left edge
            if (left < 8) {
              left = 8;
            }
          }
          
          // Calculate top position - align with top of button
          let top = rect.top;
          // If dropdown would go off-screen at the bottom, align it to the bottom of the button instead
          if (top + estimatedDropdownHeight > viewportHeight - 8) {
            top = rect.bottom - estimatedDropdownHeight;
          }
          // Ensure it doesn't go off the top edge
          if (top < 8) {
            top = 8;
          }
          
          setDropdownPosition({
            top: Math.max(8, top),
            left: Math.max(8, left),
          });
        }
      };
      
      // Calculate position immediately
      updatePosition();
      
      // Small delay to recalculate after DOM updates
      const timeoutId = setTimeout(updatePosition, 10);
      
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [profileDropdownOpen, sidebarOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || 'Admin User';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-700 ease-in-out overflow-hidden overflow-x-hidden relative`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="h-full flex flex-col overflow-hidden overflow-x-hidden">
          {/* Logo Section */}
          <div className="p-3 flex-shrink-0">
            <div className={`flex items-center ${sidebarOpen ? 'gap-2' : 'justify-center'}`}>
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white dark:text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span
                className={`text-base font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap transition-all duration-700 ease-in-out ${
                  sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                }`}
              >
                Themeplate
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden flex-shrink min-h-0">
            <div
              className={`px-2 mb-2 transition-all duration-700 ease-in-out ${
                sidebarOpen ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'
              }`}
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navigation
              </span>
            </div>
            <div className="space-y-0.5">
               {/* Admin Dashboard */}
               <button
                 onClick={() => setActiveNavItem('Admin Dashboard')}
                 className={`w-full flex items-center ${
                   sidebarOpen ? 'px-2 py-1.5 gap-2' : 'px-0 py-1.5 justify-center'
                 } rounded-md transition-colors ${
                   activeNavItem === 'Admin Dashboard'
                     ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                     : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                 }`}
                 title="Admin Dashboard"
               >
                 <svg
                   className="w-4 h-4 flex-shrink-0"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                   />
                 </svg>
                 <span
                   className={`text-sm font-normal whitespace-nowrap transition-all duration-700 ease-in-out ${
                     sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                   }`}
                 >
                   Admin Dashboard
                 </span>
               </button>

               {/* Help */}
               <button
                 onClick={() => setActiveNavItem('Help')}
                 className={`w-full flex items-center ${
                   sidebarOpen ? 'px-2 py-1.5 gap-2' : 'px-0 py-1.5 justify-center'
                 } rounded-md transition-colors ${
                   activeNavItem === 'Help'
                     ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                     : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                 }`}
                 title="Help"
               >
                 <svg
                   className="w-4 h-4 flex-shrink-0"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                   />
                 </svg>
                 <span
                   className={`text-sm font-normal whitespace-nowrap transition-all duration-700 ease-in-out ${
                     sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                   }`}
                 >
                   Help
                 </span>
               </button>
             </div>
          </nav>

          {/* Profile Section at Bottom */}
          <div className={`p-3 flex-shrink-0 relative ${sidebarOpen ? '' : 'px-2'}`}>
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-2 px-2 py-1.5' : 'justify-center px-0 py-1.5'
                } rounded-md transition-colors ${
                  profileDropdownOpen
                    ? 'bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-white dark:text-slate-900">
                    {getInitials(getUserDisplayName())}
                  </span>
                </div>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    <svg
                      className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${
                        profileDropdownOpen ? '-rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Profile Dropdown - Opens to the right */}
              {profileDropdownOpen && dropdownPosition.top > 0 && dropdownPosition.left > 0 && (
                <div
                  ref={profileDropdownRef}
                  className="fixed w-48 bg-white dark:bg-slate-800 rounded-md shadow-2xl border border-gray-200 dark:border-slate-700 z-[99999] py-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    pointerEvents: 'auto',
                    maxHeight: 'calc(100vh - 16px)',
                    overflowY: 'auto',
                    transition: 'opacity 200ms ease-out, transform 200ms ease-out',
                  }}
                >
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-white dark:text-slate-900">
                          {getInitials(getUserDisplayName())}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {getUserDisplayName()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Navigate to settings (placeholder)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Navigate to notifications (placeholder)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Notifications
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Navigate to activity logs (placeholder)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Activity Logs
                    </button>

                    <div className="border-t border-gray-200 dark:border-slate-700 my-0.5"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Left Side: Toggle, Breadcrumbs */}
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="text-gray-500 dark:text-gray-400">Home</span>
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-gray-900 dark:text-slate-100 font-medium">Dashboard</span>
              </div>
            </div>

            {/* Right Side: Status, Notifications */}
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-slate-800">
                {isOnline ? (
                  <>
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {/* WiFi signal waves */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Online</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-red-500 relative"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {/* WiFi signal waves */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                      {/* Diagonal line crossing it out */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M18.364 5.636l-12.728 12.728"
                        className="text-red-500"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Offline</span>
                  </>
                )}
              </div>

              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Notifications"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Admin Dashboard
            </h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to the admin dashboard. Content will go here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
