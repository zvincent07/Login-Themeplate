import React from 'react';

/**
 * Reusable Input Component
 * @param {Object} props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Is required
 * @param {boolean} props.disabled - Is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.maxLength - Maximum length
 * @param {Object} props.rest - Other input props
 */
const Input = ({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  maxLength,
  ...rest
}) => {
  const baseClasses = 'w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-slate-500 dark:focus:border-slate-500 bg-white dark:bg-slate-800/90 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all';
  
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      className={combinedClasses}
      {...rest}
    />
  );
};

export default Input;
