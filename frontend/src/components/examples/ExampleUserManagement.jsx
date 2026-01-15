/**
 * EXAMPLE: User Management with Reusable Components
 * 
 * This file demonstrates how to use the new reusable components:
 * - Modal
 * - Table
 * - FormField
 * - PermissionGate
 * - PermissionButton
 * - useOptimisticUpdate hook
 * 
 * Use this as a reference when refactoring Users.jsx, Roles.jsx, etc.
 */

import { useState } from 'react';
import { Modal, Table, FormField, Input, Button, PermissionButton, PermissionGate } from '../ui';
import { useOptimisticUpdate } from '../../hooks';
import { hasPermission } from '../../utils/permissions';
import authService from '../../services/authService';
import userService from '../../services/userService';

const ExampleUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  
  const user = authService.getStoredUser();
  const { updateOptimistically, rollback } = useOptimisticUpdate(setUsers);

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (user) => (
        <div className="flex items-center">
          <div className="avatar">{getInitials(user)}</div>
          <div className="ml-2">
            <div className="font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
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
        <div className="flex gap-2">
          <PermissionButton
            user={user}
            permission="users:update"
            onClick={() => handleEdit(user)}
            size="sm"
          >
            Edit
          </PermissionButton>
          <PermissionButton
            user={user}
            permission="users:delete"
            onClick={() => handleDelete(user)}
            variant="danger"
            size="sm"
          >
            Delete
          </PermissionButton>
        </div>
      ),
    },
  ];

  // Optimistic UI example: Toggle Active
  const handleToggleActive = async (user) => {
    const previousUsers = [...users];
    
    // Update UI immediately
    updateOptimistically((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    );
    
    try {
      const response = await userService.toggleActive(user.id);
      if (!response.success) throw new Error('Failed');
      setToast({ message: 'User updated!', type: 'success' });
    } catch (error) {
      rollback();
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const previousUsers = [...users];
    
    // Update UI immediately
    updateOptimistically((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    
    try {
      const response = await userService.deleteUser(selectedUser.id);
      if (!response.success) throw new Error('Failed');
      setToast({ message: 'User deleted!', type: 'success' });
    } catch (error) {
      rollback();
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div>
      {/* Permission-aware Create Button */}
      <PermissionButton
        user={user}
        permission="users:create"
        onClick={() => setShowCreateModal(true)}
      >
        Create User
      </PermissionButton>

      {/* Reusable Table */}
      <Table
        columns={columns}
        data={users}
        loading={false}
        emptyMessage="No users found"
        selectable
        selectedRows={[]}
        onSelectAll={() => {}}
        onSelectRow={() => {}}
        onRowClick={(user) => console.log('View user', user)}
      />

      {/* Reusable Modal - Create */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
        footer={
          <>
            <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={false}>
              Create
            </Button>
          </>
        }
      >
        <form>
          <FormField label="Email" required error={null}>
            <Input type="email" />
          </FormField>
          <FormField label="First Name" required error={null}>
            <Input type="text" />
          </FormField>
        </form>
      </Modal>

      {/* Reusable Modal - Delete Confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button onClick={confirmDelete} variant="danger">
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete {selectedUser?.email}?</p>
      </Modal>
    </div>
  );
};

export default ExampleUserManagement;
