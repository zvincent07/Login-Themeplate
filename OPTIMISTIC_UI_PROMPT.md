# Optimistic UI Implementation Prompt

Use this prompt when implementing new update operations to get instant UI feedback without blinking/re-rendering:

---

**Prompt:**

"Implement Optimistic UI for this [operation/feature]. When I [action description], I want the UI to update instantly before the API response comes back. Follow this pattern:

1. **Save current state** for rollback:
   ```javascript
   const previousState = [...currentState];
   ```

2. **Update UI immediately** (optimistic update):
   ```javascript
   setCurrentState(prev => /* apply changes immediately */);
   ```

3. **Make API call**:
   ```javascript
   const response = await apiCall();
   ```

4. **On success**: 
   - Do NOT refresh the data that was already updated optimistically
   - Only refresh dependent data (like stats) if needed
   - Show success toast
   ```javascript
   if (response.success) {
     // Only refresh stats or other dependent data
     fetchStats(); // NOT fetchUsers() if users were updated
     setToast({ message: 'Success!', type: 'success' });
   }
   ```

5. **On failure**: Rollback the optimistic update and show error toast
   ```javascript
   else {
     setCurrentState(previousState); // Rollback
     setToast({ message: 'Failed', type: 'error' });
   }
   ```

**Important**: Avoid calling `fetchUsers()` or similar data refresh functions after successful optimistic updates - this causes unnecessary re-rendering and blinking. Only refresh data that wasn't updated optimistically (like stats, counts, etc.).

**Example implementations** in `Users.jsx`:
- `handleToggleActive` - Toggle user active/inactive
- `handleSubmitEdit` - Edit user details  
- `handleSubmitDelete` - Delete user
- `handleTerminateSession` - Terminate session
- `handleRestore` - Restore deleted user

Apply this pattern to: [describe the new operation here]"

---

## Quick Reference

**When to use**: Any update operation (edit, delete, toggle, etc.)

**Key principle**: Update UI first, then sync with server. Only refresh what wasn't updated optimistically.

**Common mistake**: Calling `fetchUsers()` after optimistic update → causes blinking

**Solution**: Only refresh stats/counts, not the data you already updated optimistically
