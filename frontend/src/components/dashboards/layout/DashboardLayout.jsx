import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ user, navigationItems, breadcrumbs, children, notificationCount = 0 }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState(navigationItems[0]?.id || '');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleNavItemClick = (itemId) => {
    setActiveNavItem(itemId);
    // You can add navigation logic here if needed
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
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
