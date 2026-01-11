# TypeScript Migration Guide

This guide outlines the gradual TypeScript migration strategy for the Login Themeplate project.

## 🎯 Migration Strategy

### Phase 1: Setup (✅ Complete)
- [x] Add TypeScript configuration
- [x] Install TypeScript dependencies
- [x] Create example TypeScript file (`useUserFilters.ts`)

### Phase 2: Gradual Migration
- [ ] Convert hooks to TypeScript
- [ ] Convert services to TypeScript
- [ ] Convert components to TypeScript
- [ ] Add type definitions for API responses

### Phase 3: Full TypeScript
- [ ] Enable strict mode
- [ ] Add type checking to CI/CD
- [ ] Remove `.js` files (convert all to `.ts`/`.tsx`)

---

## 📦 TypeScript Setup

### Configuration Files

**`tsconfig.json`** - Main TypeScript config
- Strict mode enabled
- React JSX support
- Path aliases configured

**`tsconfig.node.json`** - Node-specific config
- For Vite config files

---

## 🔄 Migration Process

### Step 1: Convert a File

1. **Rename file**: `.js` → `.ts` (or `.jsx` → `.tsx`)
2. **Add types**:
   ```typescript
   // Before
   const useUserFilters = () => { ... }
   
   // After
   interface UseUserFiltersReturn {
     users: User[];
     loading: boolean;
     // ...
   }
   
   const useUserFilters = (): UseUserFiltersReturn => { ... }
   ```
3. **Fix type errors**
4. **Test the changes**

### Step 2: Add Type Definitions

Create `types/` directory for shared types:

```typescript
// types/user.ts
export interface User {
  _id?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleName: 'admin' | 'employee' | 'user';
  isActive: boolean;
  isEmailVerified: boolean;
  deletedAt?: Date | null;
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    pages: number;
    total: number;
  };
}
```

### Step 3: Update Imports

```typescript
// Before
import { useUserFilters } from '../hooks/useUserFilters';

// After (TypeScript automatically resolves .ts extension)
import { useUserFilters } from '../hooks/useUserFilters';
import type { User } from '../types/user';
```

---

## 🛠️ TypeScript Commands

```bash
# Type check (without building)
npx tsc --noEmit

# Build TypeScript
npx tsc

# Watch mode
npx tsc --watch
```

---

## 📝 Example: Converting a Hook

### Before (JavaScript)

```javascript
export const useUserFilters = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  return {
    users,
    loading,
    setUsers,
  };
};
```

### After (TypeScript)

```typescript
interface User {
  _id?: string;
  id?: string;
  email: string;
  // ...
}

interface UseUserFiltersReturn {
  users: User[];
  loading: boolean;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const useUserFilters = (): UseUserFiltersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  return {
    users,
    loading,
    setUsers,
  };
};
```

---

## 🎨 TypeScript Best Practices

### 1. Use Interfaces for Objects

```typescript
interface User {
  email: string;
  name: string;
}
```

### 2. Use Types for Unions/Intersections

```typescript
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = User & { status: Status };
```

### 3. Avoid `any`, Use `unknown` Instead

```typescript
// ❌ Bad
function processData(data: any) { ... }

// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'string') {
    // TypeScript knows data is string here
  }
}
```

### 4. Use Generic Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const response: ApiResponse<User> = await getUser();
```

### 5. Use Utility Types

```typescript
type PartialUser = Partial<User>;
type UserEmail = Pick<User, 'email'>;
type UserWithoutId = Omit<User, '_id' | 'id'>;
```

---

## 🔍 Common TypeScript Patterns

### React Component Props

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  // ...
};
```

### API Service Functions

```typescript
async function getUser(userId: string): Promise<ApiResponse<User>> {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}
```

### Event Handlers

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

---

## 🚨 Migration Checklist

When converting a file:

- [ ] Rename `.js` → `.ts` (or `.jsx` → `.tsx`)
- [ ] Add type annotations
- [ ] Fix type errors
- [ ] Update imports (if needed)
- [ ] Test the changes
- [ ] Update documentation

---

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## ⚠️ Notes

- **Gradual Migration**: You can have `.js` and `.ts` files side-by-side
- **No Breaking Changes**: TypeScript is a superset of JavaScript
- **Optional**: Type annotations are optional (but recommended)
- **Build Process**: Vite handles TypeScript compilation automatically

---

## 🎯 Next Steps

1. Convert remaining hooks to TypeScript
2. Convert services to TypeScript
3. Add type definitions for API responses
4. Convert components gradually
5. Enable strict mode when ready
