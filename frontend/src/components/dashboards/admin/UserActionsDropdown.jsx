/**
 * USER ACTIONS DROPDOWN COMPONENT
 * Reusable dropdown menu for user actions
 */

import { DropdownMenu } from '../../ui';

const UserActionsDropdown = ({
  user,
  isCurrentUser,
  isDeleted,
  submitting,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  onRestore,
  currentUserId,
  authService,
  setToast,
}) => {
  const userId = user._id || user.id;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userIdStr = String(userId || '');
    let currentUserIdToCheck = currentUserId;
    if (!currentUserIdToCheck) {
      try {
        const storedUser = authService.getStoredUser();
        currentUserIdToCheck = storedUser?.id || storedUser?._id;
      } catch {
        // Ignore
      }
    }
    const currentUserIdStr = String(currentUserIdToCheck || '');
    
    const isOwnAccount = currentUserIdToCheck && userId && (
      userId === currentUserIdToCheck || 
      userIdStr === currentUserIdStr ||
      userId.toString() === currentUserIdToCheck.toString() ||
      String(userId) === String(currentUserIdToCheck)
    );
    
    if (isOwnAccount || isCurrentUser) {
      setToast({
        message: 'You cannot edit your own account.',
        type: 'error',
      });
      return;
    }
    onEdit(user);
  };

  const handleToggleActive = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userIdStr = String(userId || '');
    let currentUserIdToCheck = currentUserId;
    if (!currentUserIdToCheck) {
      try {
        const storedUser = authService.getStoredUser();
        currentUserIdToCheck = storedUser?.id || storedUser?._id;
      } catch {
        // Ignore
      }
    }
    const currentUserIdStr = String(currentUserIdToCheck || '');
    
    const isOwnAccount = currentUserIdToCheck && userId && (
      userId === currentUserIdToCheck || 
      userIdStr === currentUserIdStr ||
      userId.toString() === currentUserIdToCheck.toString() ||
      String(userId) === String(currentUserIdToCheck)
    );
    
    if (isOwnAccount || isCurrentUser) {
      setToast({
        message: 'You cannot deactivate your own account.',
        type: 'error',
      });
      return;
    }
    
    if (submitting) return;
    onToggleActive(user);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userIdStr = String(userId || '');
    let currentUserIdToCheck = currentUserId;
    if (!currentUserIdToCheck) {
      try {
        const storedUser = authService.getStoredUser();
        currentUserIdToCheck = storedUser?.id || storedUser?._id;
      } catch {
        // Ignore
      }
    }
    const currentUserIdStr = String(currentUserIdToCheck || '');
    
    const isOwnAccount = currentUserIdToCheck && userId && (
      userId === currentUserIdToCheck || 
      userIdStr === currentUserIdStr ||
      userId.toString() === currentUserIdToCheck.toString() ||
      String(userId) === String(currentUserIdToCheck)
    );
    
    if (isOwnAccount || isCurrentUser) {
      setToast({
        message: 'You cannot delete your own account.',
        type: 'error',
      });
      return;
    }
    onDelete(user);
  };

  return (
    <DropdownMenu
      trigger={
        <button
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title="Actions"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
        </button>
      }
      isOpen={false}
      onClose={() => {}}
      position="bottom"
    >
      {isDeleted ? (
        <>
          <DropdownMenu.Item onClick={() => onView(user)}>
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => onRestore(user)} disabled={submitting} variant="success">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restore</span>
          </DropdownMenu.Item>
        </>
      ) : (
        <>
          <DropdownMenu.Item onClick={() => onView(user)}>
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handleEdit} disabled={isCurrentUser}>
            <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className={isCurrentUser ? 'line-through' : ''}>Edit</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handleToggleActive} disabled={isCurrentUser || submitting}>
            {user.isActive ? (
              <>
                <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-gray-500' : 'text-amber-600 dark:text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className={isCurrentUser ? 'line-through' : ''}>Deactivate</span>
              </>
            ) : (
              <>
                <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-gray-500' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={isCurrentUser ? 'line-through' : ''}>Activate</span>
              </>
            )}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handleDelete} disabled={isCurrentUser} variant="danger">
            <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-gray-500' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className={isCurrentUser ? 'line-through text-gray-400 dark:text-gray-500' : 'text-red-600 dark:text-red-400'}>Delete</span>
          </DropdownMenu.Item>
        </>
      )}
    </DropdownMenu>
  );
};

export default UserActionsDropdown;
