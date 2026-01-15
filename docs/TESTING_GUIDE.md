# Testing Guide

## Overview

This guide covers testing strategies for the application following `.cursorrules` principles.

---

## 🎯 Testing Philosophy

### **Test Services, Not Controllers**
- Controllers are thin - test services instead
- Services contain business logic and permission enforcement
- Controllers are just request/response handlers

### **Mock Repositories**
- Repositories are database access layer
- Mock repositories in service tests
- Test repositories separately with mocked models

### **Test Permission Enforcement**
- Verify permissions are checked
- Test ownership checks
- Test access control

### **Test Business Rules**
- Test invariants
- Test validation logic
- Test error handling

---

## 📁 Test Structure

```
backend/src/
├── services/
│   └── __tests__/
│       ├── userService.test.js
│       ├── authService.test.js
│       └── roleService.test.js
├── repositories/
│   └── __tests__/
│       ├── userRepository.test.js
│       └── roleRepository.test.js
└── permissions/
    └── __tests__/
        └── index.test.js

frontend/src/
├── services/
│   └── __tests__/
│       ├── userService.test.js
│       └── authService.test.js
└── components/
    └── __tests__/
        └── Login.test.jsx
```

---

## 🧪 Running Tests

### Backend
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:services
npm run test:repositories
npm run test:permissions

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Frontend
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📝 Test Examples

### Service Test Example

```javascript
describe('UserService', () => {
  it('should enforce permission before returning users', async () => {
    requirePermission.mockImplementation(() => {});
    userRepository.findMany.mockResolvedValue({ users: [] });

    await userService.getUsers({}, {}, mockActor);

    expect(requirePermission).toHaveBeenCalledWith(
      mockActor,
      'users:read',
      'users list'
    );
  });
});
```

### Repository Test Example

```javascript
describe('UserRepository', () => {
  it('should whitelist filter fields', async () => {
    await userRepository.findMany(
      { roleName: 'admin', maliciousField: 'hack' },
      {}
    );

    const queryCall = User.find.mock.calls[0][0];
    expect(queryCall.maliciousField).toBeUndefined();
    expect(queryCall.roleName).toBe('admin');
  });
});
```

---

## ✅ Test Coverage Goals

- **Services**: 80%+ coverage
- **Repositories**: 70%+ coverage
- **Permissions**: 100% coverage
- **Controllers**: Not required (too thin)

---

## 🔍 What to Test

### **Services**
- ✅ Permission enforcement
- ✅ Business rules
- ✅ Ownership checks
- ✅ Error handling
- ✅ Repository coordination

### **Repositories**
- ✅ Query building
- ✅ Whitelisting
- ✅ Data transformation
- ✅ Error handling

### **Permissions**
- ✅ Permission checking
- ✅ Role mapping
- ✅ Access control
- ✅ Edge cases

---

## 🚫 What NOT to Test

- ❌ Controllers (too thin, test services instead)
- ❌ Express middleware (test in integration tests)
- ❌ Database connection (test in E2E tests)
- ❌ External APIs (mock them)

---

## 📚 Test Utilities

### Mock Factories
Create reusable mock factories for common objects:

```javascript
const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  email: 'test@example.com',
  roleName: 'user',
  ...overrides,
});
```

### Test Helpers
Create helpers for common test patterns:

```javascript
const expectPermissionRequired = async (serviceMethod, permission) => {
  requirePermission.mockImplementation(() => {
    throw new Error('Permission denied');
  });
  
  await expect(serviceMethod()).rejects.toThrow('Permission denied');
  expect(requirePermission).toHaveBeenCalledWith(
    expect.any(Object),
    permission,
    expect.any(String)
  );
};
```

---

## 🎯 Next Steps

1. Add more service tests
2. Add repository tests
3. Add integration tests
4. Add E2E tests (Playwright)
5. Set up CI/CD test pipeline

---

**Status**: Test structure created, ready for implementation
