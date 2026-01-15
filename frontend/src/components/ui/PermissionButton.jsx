/**
 * PERMISSION-AWARE BUTTON COMPONENT
 * 
 * Automatically hides if user doesn't have permission
 * 
 * Usage:
 * <PermissionButton
 *   user={user}
 *   permission="users:create"
 *   onClick={handleCreate}
 * >
 *   Create User
 * </PermissionButton>
 */

import Button from './Button';
import PermissionGate from './PermissionGate';

const PermissionButton = ({
  user,
  permission,
  permissions = [],
  requireAll = false,
  children,
  ...buttonProps
}) => {
  return (
    <PermissionGate
      user={user}
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
    >
      <Button {...buttonProps}>{children}</Button>
    </PermissionGate>
  );
};

export default PermissionButton;
