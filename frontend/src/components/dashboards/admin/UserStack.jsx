import React from 'react';

/**
 * Avatar Stack Component - Shows overlapping user avatars
 * Displays first 3 avatars, then shows a count badge for remaining users
 */
const UserStack = ({ users = [], count = 0 }) => {
  // Get initials for avatar
  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get avatar background color based on user (for variety)
  const getAvatarColor = (user) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-teal-500 dark:bg-teal-600',
      'bg-cyan-500 dark:bg-cyan-600',
      'bg-emerald-500 dark:bg-emerald-600',
      'bg-amber-500 dark:bg-amber-600',
    ];
    // Use user ID or email to consistently assign a color
    const id = (user._id || user.id || user.email || '').toString();
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // If no users, show zero
  if (count === 0 && (!users || users.length === 0)) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">0</span>
    );
  }

  // Show up to 3 avatars
  const displayUsers = users.slice(0, 3);
  const remainingCount = count > users.length ? count - users.length : Math.max(0, count - 3);

  return (
    <div className="flex -space-x-2 items-center">
      {displayUsers.map((user, i) => {
        // Use explicit z-index values (Tailwind doesn't support dynamic z-index)
        const zIndex = i === 0 ? 30 : i === 1 ? 20 : 10;
        return (
        <div
          key={user._id || user.id || i}
          className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 ${getAvatarColor(user)} flex items-center justify-center text-xs font-medium text-white relative`}
          style={{ zIndex }}
          title={user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={getInitials(user)}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-white">
              {getInitials(user)}
            </span>
          )}
        </div>
        );
      })}
      
      {/* Show count badge if there are more users */}
      {remainingCount > 0 && (
        <div
          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-white relative"
          style={{ zIndex: 5 }}
          title={`${remainingCount} more user${remainingCount !== 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default UserStack;
