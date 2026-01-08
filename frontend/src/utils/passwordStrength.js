// Password strength checker
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  let score = 0;

  if (checks.length) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  if (score === 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  else strength = 'weak';

  return {
    strength,
    score,
    checks,
    isValid: score === 5,
  };
};

export const getPasswordRequirements = () => [
  { key: 'length', text: 'At least 8 characters' },
  { key: 'uppercase', text: 'One uppercase letter' },
  { key: 'lowercase', text: 'One lowercase letter' },
  { key: 'number', text: 'One number' },
  { key: 'special', text: 'One special character (!@#$%^&*...)' },
];
