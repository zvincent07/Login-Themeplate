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
  const baseClasses = 'w-full px-2.5 py-2 text-sm border border-gray-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-500 focus:border-slate-500 dark:focus:border-slate-500 outline-none transition-colors [&:-webkit-autofill]:!shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:rgb(17,24,39)] dark:[&:-webkit-autofill]:!shadow-[0_0_0_1000px_rgb(51,65,85)_inset] dark:[&:-webkit-autofill]:![-webkit-text-fill-color:rgb(241,245,249)] [&:-webkit-autofill:hover]:!shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill:hover]:![-webkit-text-fill-color:rgb(17,24,39)] dark:[&:-webkit-autofill:hover]:!shadow-[0_0_0_1000px_rgb(51,65,85)_inset] dark:[&:-webkit-autofill:hover]:![-webkit-text-fill-color:rgb(241,245,249)] [&:-webkit-autofill:focus]:!shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill:focus]:![-webkit-text-fill-color:rgb(17,24,39)] dark:[&:-webkit-autofill:focus]:!shadow-[0_0_0_1000px_rgb(51,65,85)_inset] dark:[&:-webkit-autofill:focus]:![-webkit-text-fill-color:rgb(241,245,249)] [&:-webkit-autofill:active]:!shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill:active]:![-webkit-text-fill-color:rgb(17,24,39)] dark:[&:-webkit-autofill:active]:!shadow-[0_0_0_1000px_rgb(51,65,85)_inset] dark:[&:-webkit-autofill:active]:![-webkit-text-fill-color:rgb(241,245,249)]';
  
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
