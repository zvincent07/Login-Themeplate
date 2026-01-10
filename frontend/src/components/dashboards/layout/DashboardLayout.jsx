import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ user, navigationItems, breadcrumbs, children, notificationCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Determine active nav item based on current route
  const getActiveNavItem = () => {
    const currentPath = location.pathname;
    const activeItem = navigationItems.find(item => {
      if (item.path) {
        // Handle exact match or path starts with the item path
        return currentPath === item.path || currentPath.startsWith(item.path + '/');
      }
      return false;
    });
    return activeItem?.id || navigationItems[0]?.id || '';
  };

  const [activeNavItem, setActiveNavItem] = useState(getActiveNavItem());

  useEffect(() => {
    setActiveNavItem(getActiveNavItem());
  }, [location.pathname]);

  const handleNavItemClick = (itemId) => {
    const item = navigationItems.find(nav => nav.id === itemId);
    if (item?.path) {
      navigate(item.path);
    }
    setActiveNavItem(itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex overflow-x-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        user={user}
        navigationItems={navigationItems}
        activeNavItem={activeNavItem}
        onNavItemClick={handleNavItemClick}
        profileDropdownOpen={profileDropdownOpen}
        setProfileDropdownOpen={setProfileDropdownOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden overflow-x-hidden">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={breadcrumbs}
          notificationCount={notificationCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
