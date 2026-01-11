import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';

const ProfileDropdown = ({ user, isOpen, onClose, sidebarOpen, profileButtonRef }) => {
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && profileButtonRef.current) {
      const updatePosition = () => {
        if (profileButtonRef.current) {
          const rect = profileButtonRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const dropdownWidth = 192; // w-48 = 12rem = 192px
          const estimatedDropdownHeight = 200;
          
          let left = rect.right + 8;
          
          if (left + dropdownWidth > viewportWidth - 8) {
            left = rect.left - dropdownWidth - 8;
            if (left < 8) {
              left = 8;
            }
          }
          
          let top = rect.top;
          if (top + estimatedDropdownHeight > viewportHeight - 8) {
            top = rect.bottom - estimatedDropdownHeight;
          }
          if (top < 8) {
            top = 8;
          }
          
          setDropdownPosition({
            top: Math.max(8, top),
            left: Math.max(8, left),
          });
        }
      };
      
      updatePosition();
      const timeoutId = setTimeout(updatePosition, 10);
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, sidebarOpen, profileButtonRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, profileButtonRef]);

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
    return user?.email?.split('@')[0] || 'User';
  };

  if (!isOpen || !(dropdownPosition.top > 0 && dropdownPosition.left > 0)) {
    return null;
  }

  return (
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
            onClose();
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
            onClose();
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
            onClose();
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
  );
};

export default ProfileDropdown;
