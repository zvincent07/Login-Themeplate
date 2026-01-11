const { validatePassword } = require('../passwordValidator');

describe('passwordValidator', () => {
  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('StrongP@ss1')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
    });

    it('should return false for password shorter than 8 characters', () => {
      expect(validatePassword('Pass1!')).toBe(false);
      expect(validatePassword('P@ss1')).toBe(false);
    });

    it('should return false for password without uppercase', () => {
      expect(validatePassword('password123!')).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      expect(validatePassword('PASSWORD123!')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(validatePassword('Password!')).toBe(false);
    });

    it('should return false for password without special character', () => {
      expect(validatePassword('Password123')).toBe(false);
    });

    it('should return false for empty password', () => {
      expect(validatePassword('')).toBe(false);
    });
  });
});
