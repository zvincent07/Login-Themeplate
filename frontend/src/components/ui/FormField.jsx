/**
 * REUSABLE FORM FIELD COMPONENT
 * 
 * Provides consistent form field styling and error handling
 * 
 * Usage:
 * <FormField
 *   label="Email"
 *   required
 *   error={errors.email}
 * >
 *   <Input
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </FormField>
 */

import Label from './Label';

const FormField = ({
  label,
  required = false,
  error,
  children,
  className = '',
  helpText,
}) => {
  return (
    <div className={className}>
      {label && (
        <Label required={required} className="mb-1">
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;
