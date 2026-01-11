import React, { useRef, useState } from 'react';
import ProfileDropdown from './ProfileDropdown';

const Sidebar = ({ sidebarOpen, user, navigationItems = [], navigationGroups = [], activeNavItem, onNavItemClick, profileDropdownOpen, setProfileDropdownOpen }) => {
  const profileButtonRef = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState({});

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
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-56' : 'w-16'
      } fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-700 ease-in-out overflow-hidden overflow-x-hidden z-50`}
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
            {/* Render top-level navigation items first */}
            {Array.isArray(navigationItems) && navigationItems.length > 0 && navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavItemClick(item.id)}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'px-2 py-1.5 gap-2' : 'px-0 py-1.5 justify-center'
                } rounded-md transition-colors ${
                  activeNavItem === item.id
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
                title={item.label}
              >
                {typeof item.icon === 'function' ? (
                  item.icon()
                ) : (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {item.icon}
                  </svg>
                )}
                <span
                  className={`text-sm font-normal whitespace-nowrap transition-all duration-700 ease-in-out ${
                    sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
            
            {/* Render grouped navigation if groups exist */}
            {Array.isArray(navigationGroups) && navigationGroups.length > 0 && navigationGroups.map((group) => {
              if (!group || !group.items || !Array.isArray(group.items)) {
                return null;
              }
              const isExpanded = expandedGroups[group.id] ?? (group.defaultExpanded ?? true);
              return (
                <div key={group.id} className="mb-1">
                  {/* Group Header */}
                  <button
                    onClick={() => {
                      if (sidebarOpen) {
                        setExpandedGroups(prev => ({
                          ...prev,
                          [group.id]: !isExpanded
                        }));
                      }
                    }}
                    className={`w-full flex items-center ${
                      sidebarOpen ? 'px-2 py-1.5 gap-2' : 'px-0 py-1.5 justify-center'
                    } rounded-md transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50`}
                    title={group.label}
                  >
                    {group.icon && (
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {group.icon}
                      </svg>
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider flex-1 text-left transition-all duration-700 ease-in-out ${
                        sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                      }`}
                    >
                      {group.label}
                    </span>
                    {sidebarOpen && (
                      <svg
                        className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
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
                    )}
                  </button>
                  {/* Group Items */}
                  {isExpanded && group.items && group.items.length > 0 && (
                    <div className={`ml-2 mt-0.5 space-y-0.5 ${sidebarOpen ? '' : 'hidden'}`}>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onNavItemClick(item.id)}
                          className={`w-full flex items-center ${
                            sidebarOpen ? 'px-2 py-1.5 gap-2' : 'px-0 py-1.5 justify-center'
                          } rounded-md transition-colors ${
                            activeNavItem === item.id
                              ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }`}
                          title={item.label}
                        >
                          {typeof item.icon === 'function' ? (
                            item.icon()
                          ) : (
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {item.icon}
                            </svg>
                          )}
                          <span
                            className={`text-sm font-normal whitespace-nowrap transition-all duration-700 ease-in-out ${
                              sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

            <ProfileDropdown
              user={user}
              isOpen={profileDropdownOpen}
              onClose={() => setProfileDropdownOpen(false)}
              sidebarOpen={sidebarOpen}
              profileButtonRef={profileButtonRef}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
