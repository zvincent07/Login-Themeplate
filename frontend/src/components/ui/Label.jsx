import React from 'react';

/**
 * Reusable Label Component
 * @param {Object} props
 * @param {string} props.htmlFor - Label for attribute
 * @param {boolean} props.required - Show required indicator
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Label content
 * @param {Object} props.rest - Other label props
 */
const Label = ({
  htmlFor,
  required = false,
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <label htmlFor={htmlFor} className={combinedClasses} {...rest}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
