/**
 * REUSABLE BADGE COMPONENT
 * 
 * Usage:
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Inactive</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="info">Info</Badge>
 */

const Badge = ({
  children,
  variant = 'default', // success, danger, warning, info, default
  size = 'sm', // sm, md
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
