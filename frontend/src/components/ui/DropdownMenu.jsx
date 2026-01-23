/**
 * REUSABLE DROPDOWN MENU COMPONENT
 * 
 * Usage:
 * <DropdownMenu
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   trigger={<button>Actions</button>}
 *   position="bottom" // or "top"
 * >
 *   <DropdownMenu.Item onClick={handleEdit}>Edit</DropdownMenu.Item>
 *   <DropdownMenu.Item onClick={handleDelete} variant="danger">Delete</DropdownMenu.Item>
 * </DropdownMenu>
 */

import { useEffect, useRef } from 'react';

const DropdownMenu = ({
  isOpen,
  onClose,
  trigger,
  children,
  position = 'bottom', // 'top' or 'bottom'
  className = '',
}) => {
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
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
  }, [isOpen, onClose]);

  // Calculate position
  useEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const menuHeight = menuRect.height || 200;

      // Auto-adjust position if needed
      if (position === 'bottom' && spaceBelow < menuHeight && spaceAbove > menuHeight) {
        menuRef.current.style.bottom = `${window.innerHeight - triggerRect.top + 4}px`;
        menuRef.current.style.top = 'auto';
      } else if (position === 'top' && spaceAbove < menuHeight && spaceBelow > menuHeight) {
        menuRef.current.style.top = `${triggerRect.bottom + 4}px`;
        menuRef.current.style.bottom = 'auto';
      }
    }
  }, [isOpen, position]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    // Don't call onClose here - let parent control it
  };

  return (
    <div className={`relative dropdown-container ${className}`}>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className={`fixed w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-[100] py-1 ${
            position === 'top'
              ? 'animate-[fadeIn_0.2s_ease-out_forwards,slideUp_0.2s_ease-out_forwards]'
              : 'animate-[fadeIn_0.2s_ease-out_forwards,slideDown_0.2s_ease-out_forwards]'
          }`}
          style={{
            left: triggerRef.current
              ? `${triggerRef.current.getBoundingClientRect().left}px`
              : '0px',
            [position === 'top' ? 'bottom' : 'top']: triggerRef.current
              ? `${position === 'top' ? window.innerHeight - triggerRef.current.getBoundingClientRect().top + 4 : triggerRef.current.getBoundingClientRect().bottom + 4}px`
              : '0px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, variant = 'default', disabled, className = '' }) => {
  const variantClasses = {
    default: 'text-gray-700 dark:text-gray-300',
    danger: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

DropdownMenu.Item = DropdownMenuItem;

export default DropdownMenu;
