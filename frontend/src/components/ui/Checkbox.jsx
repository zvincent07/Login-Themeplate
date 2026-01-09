import React from 'react';

/**
 * Reusable Checkbox Component
 * @param {Object} props
 * @param {string} props.id - Checkbox ID
 * @param {string} props.name - Checkbox name
 * @param {boolean} props.checked - Is checked
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.label - Label text
 * @param {Object} props.rest - Other checkbox props
 */
const Checkbox = ({
  id,
  name,
  checked,
  onChange,
  disabled = false,
  className = '',
  label,
  ...rest
}) => {
  const baseClasses = 'w-3.5 h-3.5 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-slate-800';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={combinedClasses}
        {...rest}
      />
      {label && (
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-xs">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
