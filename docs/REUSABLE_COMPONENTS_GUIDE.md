# Reusable Components Guide

**Date**: 2024  
**Status**: ✅ **COMPLETE**

---

## ✅ Created Reusable Components

### **1. Modal Component** ✅

**Location**: `frontend/src/components/ui/Modal.jsx`

**Features**:
- Consistent modal styling
- Escape key support
- Backdrop click to close (optional)
- Body scroll lock when open
- Customizable sizes (sm, md, lg, xl, 2xl, 4xl, full)
- Optional title and footer

**Usage**:
```jsx
import { Modal, Button } from '../ui';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Create New User"
  size="md"
  footer={
    <>
      <Button onClick={() => setShowModal(false)}>Cancel</Button>
      <Button onClick={handleSubmit} loading={submitting}>
        Create
      </Button>
    </>
  }
>
  {/* Modal content */}
</Modal>
```

**Before** (inline modal - 30+ lines):
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Title</h2>
          <button onClick={() => setShowModal(false)}>×</button>
        </div>
        {/* Content */}
      </div>
    </div>
  </div>
)}
```

**After** (reusable component - 5 lines):
```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Title"
>
  {/* Content */}
</Modal>
```

---

### **2. Table Component** ✅

**Location**: `frontend/src/components/ui/Table.jsx`

**Features**:
- Config-driven columns
- Built-in selection support
- Loading and empty states
- Responsive column hiding
- Row click handlers
- Custom cell rendering

**Usage**:
```jsx
import { Table } from '../ui';

<Table
  columns={[
    {
      key: 'name',
      label: 'Name',
      render: (user) => `${user.firstName} ${user.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
      responsive: 'hidden md:table-cell',
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <span className="badge">{user.roleName}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <Button onClick={() => handleEdit(user)}>Edit</Button>
      ),
    },
  ]}
  data={users}
  loading={loading}
  emptyMessage="No users found"
  selectable
  selectedRows={selectedIds}
  onSelectAll={handleSelectAll}
  onSelectRow={handleSelectRow}
  onRowClick={handleView}
/>
```

**Before** (inline table - 100+ lines):
```jsx
<table className="min-w-full divide-y divide-gray-200">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

**After** (reusable component - 15 lines):
```jsx
<Table
  columns={columns}
  data={users}
  loading={loading}
/>
```

---

### **3. FormField Component** ✅

**Location**: `frontend/src/components/ui/FormField.jsx`

**Features**:
- Consistent label styling
- Error message display
- Help text support
- Required field indicator

**Usage**:
```jsx
import { FormField, Input } from '../ui';

<FormField
  label="Email"
  required
  error={errors.email}
  helpText="We'll never share your email"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>
```

**Before** (inline form field - 10+ lines):
```jsx
<div>
  <label className="block text-xs font-medium mb-1">
    Email *
  </label>
  <input type="email" value={email} onChange={...} />
  {errors.email && (
    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
  )}
</div>
```

**After** (reusable component - 5 lines):
```jsx
<FormField label="Email" required error={errors.email}>
  <Input type="email" value={email} onChange={...} />
</FormField>
```

---

### **4. PermissionGate Component** ✅

**Location**: `frontend/src/components/ui/PermissionGate.jsx`

**Features**:
- Conditional rendering based on permissions
- Support for single or multiple permissions
- Optional fallback content
- Require all or any permission

**Usage**:
```jsx
import { PermissionGate } from '../ui';
import authService from '../services/authService';

const user = authService.getStoredUser();

<PermissionGate user={user} permission="users:create">
  <Button onClick={handleCreate}>Create User</Button>
</PermissionGate>

<PermissionGate
  user={user}
  permissions={['users:update', 'users:delete']}
  requireAll={false}
  fallback={<p>No permission</p>}
>
  <Button>Edit or Delete</Button>
</PermissionGate>
```

**Before** (inline permission check - 5+ lines):
```jsx
{hasPermission(user, 'users:create') && (
  <Button onClick={handleCreate}>Create User</Button>
)}
```

**After** (reusable component - 3 lines):
```jsx
<PermissionGate user={user} permission="users:create">
  <Button onClick={handleCreate}>Create User</Button>
</PermissionGate>
```

---

### **5. PermissionButton Component** ✅

**Location**: `frontend/src/components/ui/PermissionButton.jsx`

**Features**:
- Automatically hides if no permission
- All Button props supported
- Single or multiple permissions

**Usage**:
```jsx
import { PermissionButton } from '../ui';
import authService from '../services/authService';

const user = authService.getStoredUser();

<PermissionButton
  user={user}
  permission="users:create"
  onClick={handleCreate}
  loading={submitting}
>
  Create User
</PermissionButton>
```

**Before** (inline permission check + button - 5+ lines):
```jsx
{hasPermission(user, 'users:create') && (
  <Button onClick={handleCreate}>Create User</Button>
)}
```

**After** (reusable component - 1 component):
```jsx
<PermissionButton
  user={user}
  permission="users:create"
  onClick={handleCreate}
>
  Create User
</PermissionButton>
```

---

### **6. useOptimisticUpdate Hook** ✅

**Location**: `frontend/src/hooks/useOptimisticUpdate.js`

**Features**:
- Automatic state snapshot
- Optimistic updates
- Rollback on error
- Simple API

**Usage**:
```jsx
import { useOptimisticUpdate } from '../hooks';

const { updateOptimistically, rollback } = useOptimisticUpdate(setUsers);

const handleToggleActive = async (user) => {
  // 1. Snapshot current state
  const previousUsers = [...users];
  
  // 2. Update UI immediately
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
    
    // 4. Success - state already updated, optionally refresh
    setToast({ message: 'Updated!', type: 'success' });
  } catch (error) {
    // 5. Rollback on error
    rollback();
    setToast({ message: 'Failed', type: 'error' });
  }
};
```

**Before** (manual optimistic update - 15+ lines):
```jsx
const handleToggleActive = async (user) => {
  const previousUsers = [...users];
  setUsers(prev => prev.map(u => 
    u.id === user.id ? { ...u, isActive: !u.isActive } : u
  ));
  
  try {
    await apiCall();
  } catch {
    setUsers(previousUsers); // Manual rollback
  }
};
```

**After** (hook - cleaner):
```jsx
const { updateOptimistically, rollback } = useOptimisticUpdate(setUsers);

const handleToggleActive = async (user) => {
  updateOptimistically(prev => prev.map(u => 
    u.id === user.id ? { ...u, isActive: !u.isActive } : u
  ));
  
  try {
    await apiCall();
  } catch {
    rollback(); // Automatic rollback
  }
};
```

---

## 📝 Migration Examples

### **Example 1: Refactoring a Modal**

**Before** (`Users.jsx` - Create Modal):
```jsx
{showCreateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Create New User</h2>
          <button onClick={() => setShowCreateModal(false)}>×</button>
        </div>
        <form onSubmit={handleSubmitCreate}>
          {/* Form fields */}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
```

**After** (using Modal component):
```jsx
import { Modal, Button, FormField, Input } from '../ui';

<Modal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  title="Create New User"
  size="md"
  footer={
    <>
      <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
      <Button type="submit" onClick={handleSubmitCreate} loading={submitting}>
        Create User
      </Button>
    </>
  }
>
  <form onSubmit={handleSubmitCreate}>
    <FormField label="Email" required error={errors.email}>
      <Input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </FormField>
    {/* More fields */}
  </form>
</Modal>
```

**Benefits**:
- ✅ Reduced from ~30 lines to ~15 lines
- ✅ Consistent styling across all modals
- ✅ Built-in escape key and backdrop click
- ✅ Body scroll lock automatically handled

---

### **Example 2: Refactoring a Table**

**Before** (`Users.jsx` - Users Table):
```jsx
<table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
  <thead className="bg-gray-50 dark:bg-slate-700">
    <tr>
      <th>User</th>
      <th className="hidden md:table-cell">Role</th>
      <th className="hidden lg:table-cell">Status</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td className="hidden md:table-cell">{user.role}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

**After** (using Table component):
```jsx
import { Table } from '../ui';

const columns = [
  {
    key: 'user',
    label: 'User',
    render: (user) => (
      <div className="flex items-center">
        <div className="avatar">{getInitials(user)}</div>
        <div>
          <div>{user.firstName} {user.lastName}</div>
          <div className="text-xs">{user.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    label: 'Role',
    responsive: 'hidden md:table-cell',
    render: (user) => (
      <span className="badge">{user.roleName}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    responsive: 'hidden lg:table-cell',
    render: (user) => (
      <span className={user.isActive ? 'badge-green' : 'badge-red'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (user) => (
      <DropdownMenu user={user} />
    ),
  },
];

<Table
  columns={columns}
  data={filteredUsers}
  loading={loading}
  emptyMessage="No users found"
  selectable
  selectedRows={selectedUserIds}
  onSelectAll={handleSelectAll}
  onSelectRow={handleSelectRow}
  onRowClick={handleView}
/>
```

**Benefits**:
- ✅ Reduced from ~200 lines to ~50 lines
- ✅ Config-driven, easy to modify columns
- ✅ Built-in selection, loading, empty states
- ✅ Consistent styling

---

### **Example 3: Using Permission Components**

**Before** (inline permission checks):
```jsx
{hasPermission(user, 'users:create') && (
  <Button onClick={handleCreate}>Create User</Button>
)}

{hasPermission(user, 'users:delete') && (
  <Button onClick={handleDelete} variant="danger">Delete</Button>
)}
```

**After** (permission-aware components):
```jsx
import { PermissionButton } from '../ui';

<PermissionButton
  user={user}
  permission="users:create"
  onClick={handleCreate}
>
  Create User
</PermissionButton>

<PermissionButton
  user={user}
  permission="users:delete"
  onClick={handleDelete}
  variant="danger"
>
  Delete
</PermissionButton>
```

**Benefits**:
- ✅ Cleaner code
- ✅ Consistent permission checking
- ✅ Components automatically hide when no permission

---

## 🎯 Refactoring Checklist

### **Files to Refactor** (Priority Order):

1. **High Priority** (Most repeated patterns):
   - [ ] `frontend/src/components/dashboards/admin/Users.jsx`
     - Replace 4 modals with `<Modal>` component
     - Replace table with `<Table>` component
     - Replace permission checks with `<PermissionGate>` or `<PermissionButton>`
   
   - [ ] `frontend/src/components/dashboards/admin/Roles.jsx`
     - Replace 3 modals with `<Modal>` component
     - Replace table with `<Table>` component
   
   - [ ] `frontend/src/components/dashboards/admin/AuditLogs.jsx`
     - Replace table with `<Table>` component

2. **Medium Priority**:
   - [ ] `frontend/src/components/dashboards/admin/PermissionsMatrix.jsx`
     - Use `<Modal>` component
   
   - [ ] `frontend/src/components/dashboards/admin/UserSessions.jsx`
     - Use `<Modal>` component if applicable

3. **Low Priority** (Already using some reusable components):
   - Other admin components can be refactored as needed

---

## 📊 Impact Summary

### **Code Reduction**:
- **Modals**: ~30 lines → ~5-10 lines per modal (70% reduction)
- **Tables**: ~200 lines → ~50 lines per table (75% reduction)
- **Permission Checks**: ~5 lines → ~1 component (80% reduction)

### **Consistency**:
- ✅ All modals have same behavior (escape key, backdrop click, scroll lock)
- ✅ All tables have same styling and features
- ✅ All permission checks use same logic

### **Maintainability**:
- ✅ Changes to modal/table behavior only need to be made in one place
- ✅ Easier to add new features (e.g., keyboard navigation)
- ✅ Consistent UX across the application

---

## ✅ Next Steps

1. **Refactor Users.jsx**:
   - Replace modals with `<Modal>` component
   - Replace table with `<Table>` component
   - Use `<PermissionButton>` for action buttons

2. **Refactor Roles.jsx**:
   - Replace modals with `<Modal>` component
   - Replace table with `<Table>` component

3. **Refactor AuditLogs.jsx**:
   - Replace table with `<Table>` component

4. **Apply Optimistic UI**:
   - Use `useOptimisticUpdate` hook in all mutation handlers
   - Ensure consistent rollback behavior

5. **Apply Permission Components**:
   - Replace inline permission checks with `<PermissionGate>` or `<PermissionButton>`
   - Ensure all action buttons are permission-aware

---

**Last Updated**: 2024  
**Status**: ✅ **Reusable Components Created** - Ready for Migration
