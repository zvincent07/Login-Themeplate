/**
 * REUSABLE PASSWORD INPUT COMPONENT
 * 
 * Usage:
 * <PasswordInput
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   showPassword={showPassword}
 *   onTogglePassword={() => setShowPassword(!showPassword)}
 *   error={errors.password}
 * />
 */

import { useState } from 'react';
import Input from './Input';
import FormField from './FormField';

const PasswordInput = ({
  value,
  onChange,
  error,
  label = 'Password',
  required = false,
  placeholder = 'Enter password',
  showPassword: controlledShowPassword,
  onTogglePassword: controlledOnTogglePassword,
  className = '',
  ...props
}) => {
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  
  const showPassword = controlledShowPassword !== undefined ? controlledShowPassword : internalShowPassword;
  const togglePassword = controlledOnTogglePassword || (() => setInternalShowPassword(!internalShowPassword));

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pr-9"
          {...props}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71L5.12 5.12M12 12l3.71 3.71M12 12l-3.71-3.71m7.42 7.42L18.88 18.88A9.97 9.97 0 0019 12a9.97 9.97 0 00-.12-1.88m-3.17 3.17L12 12m3.71 3.71L18.88 18.88"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
    </FormField>
  );
};

export default PasswordInput;
