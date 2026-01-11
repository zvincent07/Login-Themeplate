# Testing Guide

This guide covers how to run and write tests for the Login Themeplate project.

## 📋 Test Setup

### Frontend Tests (Vitest)
- **Framework**: Vitest (fast, Vite-native)
- **Location**: `frontend/src/**/__tests__/**/*.test.js`
- **Setup**: `frontend/src/test/setup.js`

### Backend Tests (Jest)
- **Framework**: Jest
- **Location**: `backend/src/**/__tests__/**/*.test.js`
- **Setup**: `backend/src/test/setup.js`

### E2E Tests (Playwright)
- **Framework**: Playwright
- **Location**: `frontend/e2e/**/*.spec.js`
- **Config**: `frontend/playwright.config.js`

---

## 🚀 Running Tests

### Frontend Unit Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Backend Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
cd frontend

# Run E2E tests
npx playwright test

# Run E2E tests in UI mode
npx playwright test --ui

# Run E2E tests for specific browser
npx playwright test --project=chromium
```

---

## ✍️ Writing Tests

### Frontend Hook Test Example

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserFilters } from '../useUserFilters';

describe('useUserFilters', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUserFilters());
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.roleFilter).toBe('all');
  });
});
```

### Backend Utility Test Example

```javascript
const { validatePassword } = require('../passwordValidator');

describe('passwordValidator', () => {
  it('should return true for valid password', () => {
    expect(validatePassword('Password123!')).toBe(true);
  });
});
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test';

test('should display login page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
```

---

## 📊 Test Coverage Goals

- **Unit Tests**: 80%+ coverage for hooks, services, utilities
- **Integration Tests**: Critical API endpoints
- **E2E Tests**: Main user flows (login, register, admin operations)

---

## 🎯 Test Structure

```
frontend/
  src/
    hooks/
      __tests__/
        useUserFilters.test.js
        useUserManagement.test.js
    services/
      __tests__/
        userService.test.js
  test/
    setup.js
  e2e/
    auth.spec.js
    admin.spec.js

backend/
  src/
    utils/
      __tests__/
        passwordValidator.test.js
    controllers/
      __tests__/
        authController.test.js
  test/
    setup.js
```

---

## 💡 Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the code does, not how it does it

2. **Use Descriptive Test Names**
   - `should return error when email is invalid` ✅
   - `test1` ❌

3. **Arrange-Act-Assert Pattern**
   ```javascript
   // Arrange
   const input = 'test@example.com';
   
   // Act
   const result = validateEmail(input);
   
   // Assert
   expect(result).toBe(true);
   ```

4. **Mock External Dependencies**
   - Mock API calls, localStorage, etc.

5. **Test Edge Cases**
   - Empty inputs, null values, error states

6. **Keep Tests Fast**
   - Unit tests should run in milliseconds
   - Use mocks for slow operations

---

## 🔧 Troubleshooting

### Tests Not Running

1. **Check Node version**: Node.js 18+ required
2. **Install dependencies**: `npm install`
3. **Check test files**: Ensure files end with `.test.js` or `.spec.js`

### Playwright Issues

1. **Install browsers**: `npx playwright install`
2. **Check disk space**: Playwright browsers require ~500MB
3. **Check port**: Ensure port 3000 is available

### Coverage Not Showing

1. **Install coverage tool**: `npm install -D @vitest/coverage-v8`
2. **Check config**: Ensure coverage is enabled in config

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

## ✅ Example Test Checklist

- [ ] Test happy path (normal operation)
- [ ] Test error cases
- [ ] Test edge cases (empty, null, undefined)
- [ ] Test validation
- [ ] Mock external dependencies
- [ ] Use descriptive test names
- [ ] Keep tests independent
- [ ] Clean up after tests
