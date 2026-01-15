# Optimistic UI Implementation Guide

**Date**: 2024  
**Status**: ✅ **Hook Created** - Ready for Implementation

---

## ✅ Created Hook

### **useOptimisticUpdate Hook** ✅

**Location**: `frontend/src/hooks/useOptimisticUpdate.js`

**Features**:
- Automatic state snapshot
- Optimistic state updates
- Rollback on error
- Simple, consistent API

---

## 📖 Usage Pattern

### **Basic Pattern**:

```jsx
import { useOptimisticUpdate } from '../hooks';

const { updateOptimistically, rollback } = useOptimisticUpdate(setUsers);

const handleToggleActive = async (user) => {
  // 1. Snapshot current state (optional, hook does this automatically)
  const previousUsers = [...users];
  
  // 2. Update UI immediately (optimistic)
  updateOptimistically((prev) =>
    prev.map((u) =>
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    )
  );
  
  try {
    // 3. Make API call
    const response = await userService.toggleActive(user.id);
    
    if (!response.success) {
      throw new Error('Failed to update');
    }
    
    // 4. Success - state already updated optimistically
    // Optionally refresh to sync with server
    // await fetchUsers();
    setToast({ message: 'User updated!', type: 'success' });
  } catch (error) {
    // 5. Rollback optimistic update on error
    rollback();
    setToast({ message: 'Failed to update user', type: 'error' });
  }
};
```

---

## 🎯 Implementation Checklist

### **Users.jsx** - Apply Optimistic UI to:

- [x] `handleToggleActive` - Toggle user active/inactive
- [ ] `handleSubmitEdit` - Edit user details
- [ ] `handleSubmitDelete` - Delete user
- [ ] `handleTerminateSession` - Terminate user session
- [ ] `handleTerminateAllOthers` - Terminate all other sessions
- [ ] `confirmBulkDelete` - Bulk delete users
- [ ] `handleRestore` - Restore deleted user

### **Roles.jsx** - Apply Optimistic UI to:

- [ ] `handleSubmitCreate` - Create role
- [ ] `handleSubmitEdit` - Edit role
- [ ] `handleConfirmDelete` - Delete role
- [ ] `handleUpdatePermissions` - Update role permissions

### **Other Components**:

- [ ] Apply optimistic UI to all mutation operations
- [ ] Ensure consistent error handling and rollback

---

## 📝 Example: Toggle Active (Already Documented)

The `Users.jsx` file already has comments documenting the optimistic UI pattern. Here's how to implement it:

```jsx
// In Users.jsx
import { useOptimisticUpdate } from '../../../hooks';

const { updateOptimistically, rollback } = useOptimisticUpdate(filters.setUsers);

const handleToggleActive = async (user) => {
  // Snapshot previous state
  const previousUsers = [...filters.users];
  
  // Update UI immediately
  updateOptimistically((prev) =>
    prev.map((u) =>
      (u._id || u.id) === (user._id || user.id)
        ? { ...u, isActive: !u.isActive }
        : u
    )
  );
  
  try {
    // Make API call
    const response = await userService.toggleActive(user._id || user.id);
    
    if (response.success) {
      // Success - optionally refresh to sync
      await filters.refetch();
      setToast({ message: 'User updated!', type: 'success' });
    } else {
      throw new Error(response.error || 'Failed to update');
    }
  } catch (error) {
    // Rollback optimistic update
    rollback();
    setToast({ message: error.message || 'Failed to update user', type: 'error' });
  }
};
```

---

## ✅ Benefits

1. **Instant Feedback**: UI updates immediately, feels faster
2. **Better UX**: Users see changes right away
3. **Automatic Rollback**: Errors are handled gracefully
4. **Consistent Pattern**: Same approach for all mutations

---

**Last Updated**: 2024  
**Status**: ✅ **Hook Created** - Ready for Implementation
